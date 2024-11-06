import time
from datetime import datetime, UTC
from typing import List

from fastapi import APIRouter, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from backend.config import settings

from backend.sessions.dependencies import SongsApi, take_selector_type, sse_resp_wrapper
from backend.sessions.exceptions import TrackNotFoundError, LyricsOrSourceNotAvailableError
from backend.sessions.models import Sessions
from backend.sessions.schemas import SSessionCreate
from backend.sessions.dao import SessionsDAO
from backend.tracks.dao import TracksDAO

import json

from backend.tracks.models import Tracks
from backend.users.dependencies import get_current_user
from backend.users.models import Users

exercise_router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    @staticmethod
    async def send_personal_message(message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


manager = ConnectionManager()


# templates = Jinja2Templates(directory=f"{settings.STATIC_PATH}/html")

@exercise_router.get('/sessions/{session_id}')
async def get_session(user: Users = Depends(get_current_user), session_id: int = None):
    print(session_id)
    if user:
        session: Sessions = await SessionsDAO.find_one_or_none(Sessions.id == session_id)
        if session.user_id == user.id:
            track: Tracks = await TracksDAO.find_one_or_none(Tracks.id == session.track_id)

            # print(json.loads(track.lyrics)['lyrics'])

            return {
                "lyrics": json.loads(track.lyrics)['lyrics'],
                "artist_name": track.artist_name,
                "song_title": track.title,
                "image_url": None  # todo забить в бд
            }


@exercise_router.websocket("/sessions/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data: dict = json.loads(await websocket.receive_text())  #sectionIndex, lineIndex, wordIndex
            section_index = data['sectionIndex']
            line_index = data['lineIndex']
            word_index = data['wordIndex']

            # todo Заоптимизировать и сделать что бы постоянно не переподключался сокет с фронта
            # session: Sessions = await SessionsDAO.find_one_or_none(Sessions.id == session_id)
            await TracksDAO.change_lyrics_state(session_id, section_index, line_index, word_index)
            print('Пропатчено')

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print('Клиент отключился')


@exercise_router.post("/create_session")
async def create_session(session: SSessionCreate):
    downloaded_song = None
    lyrics = None
    artist_name = None
    song_name = None
    image_url = None

    while not downloaded_song or not lyrics:
        song = await SongsApi.get_song(artist_name=session.artist_name, song_name=session.song_name)
        artist_name, song_name, image_url = await SongsApi.parse_spotify_song_json(song)

        lyrics = await SongsApi.get_track_lyrics(artist_name, song_name)
        if not lyrics and not session.song_name:
            print('Неудачная попытка найти слова, пробуем другой трек...')
            time.sleep(5)
            continue

        downloaded_song = await SongsApi.download_mp3(artist_name, song_name)
        if not downloaded_song and not session.song_name:
            print('Неудачная попытка загрузки трека, пробуем другой трек...')
            time.sleep(5)
            continue
        elif not downloaded_song and session.song_name:
            print('Неудачная попытка загрузки трека, попробуйте выбрать другой трек')
            return 'Неудачная попытка поиска трека, попробуйте выбрать другой трек'

    print(downloaded_song)
    return {
        'session_id': 0,
        'lyrics': lyrics,
        'artist_name': artist_name,
        'song_title': song_name,
        'image_url': image_url
    }


@exercise_router.get("/sse_create_session")
async def sse_create_session(user: Users = Depends(get_current_user),
                             rq_artist_name: str = Query(...),
                             rq_song_name: str = Query(...)):

    async def event_generator():
        downloaded_song = None
        lyrics = None
        artist_name = None
        song_name = None
        image_url = None

        yield await sse_resp_wrapper("Начинаю поиск трека...")

        while not downloaded_song or not lyrics:
            song = await SongsApi.get_song(artist_name=rq_artist_name, song_name=rq_song_name)
            if not song and not rq_song_name:
                yield await sse_resp_wrapper("Неудачная попытка найти трек, еще одна попытка...")
                continue
            elif not song and rq_song_name:
                yield await sse_resp_wrapper("Нет существует такого трека")
                raise TrackNotFoundError

            artist_name, song_name, image_url = await SongsApi.parse_spotify_song_json(song)
            yield await sse_resp_wrapper(f"Нашли трек {artist_name} - {song_name}")

            lyrics = await SongsApi.get_track_lyrics(artist_name, song_name)
            if not lyrics and not rq_song_name:
                yield await sse_resp_wrapper("Неудачная попытка найти слова, пробую другой трек...")
                continue

            downloaded_song = await SongsApi.download_mp3(artist_name, song_name)
            if not downloaded_song and not rq_song_name:
                yield await sse_resp_wrapper("Неудачная попытка загрузки трека, пробую другой трек...")
                continue

            if (not downloaded_song or not lyrics) and rq_song_name:
                yield await sse_resp_wrapper("Нет слов или mp3 трека, попробуй выбрать другой")
                raise LyricsOrSourceNotAvailableError

        dt_now = datetime.now(UTC)

        # Создаем объект трека в бд
        new_track = await TracksDAO.create(
            created_date=dt_now,
            rq_artist_name=rq_artist_name,
            artist_name=artist_name,
            rq_title=rq_song_name,
            title=song_name,
            lyrics=json.dumps({'lyrics': lyrics}),
        )

        # Создаём сессию в бд
        new_session: Sessions = await SessionsDAO.create(
            user_id=user.id,
            track_id=new_track.id,
            created_date=dt_now,
            duration=settings.SESSION_DURATION,
            selector_type=await take_selector_type(rq_artist_name, rq_song_name),
        )

        yield f'data: {json.dumps({
            "status": "completed",
            "session_id": new_session.id,
            "lyrics": lyrics,
            "artist_name": artist_name,
            "song_title": song_name,
            "image_url": image_url
        })}\n\n'

    return StreamingResponse(event_generator(), media_type="text/event-stream")
