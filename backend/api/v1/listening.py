import os
import pprint
import time
from datetime import datetime, UTC
from typing import List

from fastapi import APIRouter, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from backend.config import settings
from backend.lyrics_states.models import LyricsStates

from backend.sessions.dependencies import SongsApi, sse_resp_wrapper
from backend.sessions.exceptions import TrackNotFoundError, LyricsOrSourceNotAvailableError, SessionFoundError
from backend.sessions.models import Sessions
from backend.sessions.schemas import SSessionCreate
from backend.sessions.dao import SessionsDAO
from backend.tracks.dao import TracksDAO
from backend.lyrics_states.dao import LyricsStatesDAO
from backend.lyrics_states.dependencies import create_lyrics_state
from backend.tracks.dependencies import S3Client

import json

from backend.tracks.models import Tracks
from backend.users.dependencies import get_current_user
from backend.users.models import Users
from backend.session_requests.dao import SessionRequestsDAO
from backend.session_requests.models import SessionRequests

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


@exercise_router.get('/sessions/{session_id}')
async def get_session(user: Users = Depends(get_current_user), session_id: int = None):
    print(session_id)
    if user:
        session: Sessions = await SessionsDAO.find_one_or_none(Sessions.id == session_id)
        if session:
            session_data, track_data, lyrics_state_data = await SessionsDAO.find_session_data(session_id)

            return {
                "lyrics": json.loads(track_data.lyrics)['lyrics'],
                "lyrics_state": json.loads(lyrics_state_data.lyrics_state)['lyrics_state'],
                "artist_name": track_data.artist_name,
                "song_title": track_data.title,
                "album_cover_url": track_data.album_cover_url,
                "mp3_url": track_data.mp3_url,
                "peaks": json.loads(track_data.peaks),
                "duration": track_data.duration,
            }
        else:
            raise SessionFoundError


@exercise_router.websocket("/sessions/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    """ Эндпойнт для изменения состояния объекта слов заполненных пользователем

    data содержит json с данными:
    sectionIndex - индекс части трека (Привев, Интро и т.д.)
    lineIndex - индекс строки в части трека
    wordIndex - индекс слова в строке
    value - значение заполненное пользователем
    revealed - индикатор подсказки, False по умолчанию
    correct - верное слово или нет, True/False, проверяется на фронте
    """

    await manager.connect(websocket)

    session: Sessions = await SessionsDAO.find_one_or_none(Sessions.id == session_id)

    await websocket.send_text(json.dumps({
        'all_points': session.all_points,
        'valid_points': session.valid_points,
        'revealed_points': session.revealed_points,
    }))

    try:
        while True:
            data: dict = json.loads(await websocket.receive_text())
            section_index = str(data['sectionIndex'])
            line_index = str(data['lineIndex'])
            word_index = str(data['wordIndex'])
            word_value = data['value']
            revealed = data['revealed']
            valid = data['valid']

            process_data = await LyricsStatesDAO.process_word_info(session_id,
                                                                   section_index,
                                                                   line_index,
                                                                   word_index,
                                                                   word_value,
                                                                   revealed,
                                                                   valid)
            print('Пропатчено')
            print(process_data)
            await websocket.send_text(json.dumps(process_data))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print('Клиент отключился')


@exercise_router.get("/sse_create_session")
async def sse_create_session(user: Users = Depends(get_current_user),
                             rq_artist_name: str = Query(...),
                             rq_song_name: str = Query(...)):
    async def event_generator():
        existing_track = None
        mp3_s3_url = None
        spotify_data = {
            'song_title': None,
            'artist_name': None,
            'spotify_id': None,
            'url': None,
            'album_cover_url': None,
        }
        genius_data = {
            'lyrics': None,
            'word_count': None,
            'url': None
        }
        # ym_data = {
        #     'file_name': None,
        #     'file_path': None,
        #     'url': None,
        # }
        youtube_data = {
            'file_name': None,
            'file_path': None,
            'url': None,
        }

        # Создаём запрос пользователя
        session_request: SessionRequests = await SessionRequestsDAO.create(
            user_id=user.id,
            created_date=datetime.now(UTC),
            rq_artist_name=rq_artist_name,
            rq_title=rq_song_name
        )

        yield await sse_resp_wrapper("Starting track search...")

        print(f'rq_artist_name: {rq_artist_name}\nrq_song_name: {rq_song_name}')

        # while not ym_data['file_name'] or not ym_data['file_path'] or not genius_data['lyrics']:
        while not youtube_data['file_name'] or not youtube_data['file_path'] or not genius_data['lyrics']:
            song = await SongsApi.get_song(artist_name=rq_artist_name, song_name=rq_song_name)
            if not song and not rq_song_name:
                yield await sse_resp_wrapper("No tracks with this artist name or band title")
                raise TrackNotFoundError
            elif not song and rq_song_name:
                yield await sse_resp_wrapper("No such track exists")
                raise TrackNotFoundError

            spotify_data = await SongsApi.parse_spotify_song_json(song)

            existing_track: Tracks | None = await TracksDAO.find_one_or_none(
                Tracks.spotify_id == spotify_data['spotify_id'])

            if existing_track:
                print('Retrieved from cache')
                # lyrics = json.loads(existing_track.lyrics)['lyrics']
                # mp3_s3_url = existing_track.mp3_url
                break

            yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
                                         f"Looking for lyrics...")

            genius_data = await SongsApi.get_track_lyrics(spotify_data['artist_name'],
                                                          spotify_data['song_title'],
                                                          rq_artist_name,
                                                          rq_song_name)
            if not genius_data['lyrics'] and not rq_song_name:
                yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
                                             f"Failed to find lyrics, trying another one track...")
                continue

            yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
                                         f"Looking for mp3 source...")

            # ym_data = await SongsApi.get_mp3_from_ym(spotify_data['artist_name'],
            #                                          spotify_data['song_title'],
            #                                          rq_artist_name,
            #                                          rq_song_name)
            # if not ym_data['file_name'] and not ym_data['file_path'] and not rq_song_name:
            #     yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
            #                                  f"Failed to download the track, trying another one track...")
            #     continue

            youtube_data = await SongsApi.get_mp3_from_youtube(spotify_data['artist_name'],
                                                               spotify_data['song_title'],)

            if not youtube_data['file_name'] and not youtube_data['file_path'] and not rq_song_name:
                yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
                                             f"Failed to download the track, trying another one track...")
                continue

            # if (not ym_data['file_name'] or not ym_data['file_path'] or not genius_data['lyrics']) and rq_song_name:
            if (not youtube_data['file_name'] or not youtube_data['file_path'] or not genius_data['lyrics']) and rq_song_name:
                yield await sse_resp_wrapper("No lyrics or MP3 track available, please try another one")
                raise LyricsOrSourceNotAvailableError

        yield await sse_resp_wrapper(f"{spotify_data['artist_name']} - {spotify_data['song_title']}\n"
                                     f"Session is ready, final preparations...")

        # Устанавливаем успешный статус реквесту
        await SessionRequestsDAO.patch(session_request, success=True)

        # Создаем шаблон для заполнения слов
        if existing_track:
            lyrics_state = await create_lyrics_state(json.loads(existing_track.lyrics)['lyrics'])
            mp3_s3_url = existing_track.mp3_url
        else:
            lyrics_state = await create_lyrics_state(genius_data['lyrics'])
            # mp3_s3_url = f'{settings.CLOUDFRONT_DOMAIN}/{ym_data['file_name']}'
            mp3_s3_url = f'{settings.CLOUDFRONT_DOMAIN}/{youtube_data['file_name']}'

            # await S3Client.upload(ym_data['file_name'], ym_data['file_path'])
            await S3Client.upload(f'{youtube_data['file_name']}', youtube_data['file_path'])

            # os.remove(ym_data['file_path'])
            os.remove(youtube_data['file_path'])

        # print(youtube_data['duration'])
        # print(type(youtube_data['duration']))

        # Создаем объект трека в бд
        if not existing_track:
            new_track: Tracks = await TracksDAO.create(
                artist_name=spotify_data['artist_name'],
                title=spotify_data['song_title'],
                lyrics=json.dumps({'lyrics': genius_data['lyrics']}),
                mp3_url=mp3_s3_url,
                album_cover_url=spotify_data['album_cover_url'],
                word_count=genius_data['word_count'],
                spotify_id=spotify_data['spotify_id'],
                spotify_url=spotify_data['url'],
                genius_url=genius_data['url'],
                youtube_url=youtube_data['url'],
                peaks=json.dumps(youtube_data['peaks']),
                duration=youtube_data['duration'],
                # ym_url=ym_data['url'],
            )
        else:
            new_track = existing_track

        # Создаем объект слов которые заполнил пользователь
        new_lyrics_state: LyricsStates = await LyricsStatesDAO.create(
            lyrics_state=json.dumps({'lyrics_state': lyrics_state}))

        # Создаём сессию в бд
        new_session: Sessions = await SessionsDAO.create(
            user_id=user.id,
            track_id=new_track.id,
            lyrics_state_id=new_lyrics_state.id,
            session_request_id=session_request.id,
            created_date=datetime.now(UTC),
            all_points=new_track.word_count,
        )

        yield f'data: {json.dumps({
            "status": "completed",
            "session_id": new_session.id,
            "lyrics": new_track.lyrics,
            "lyrics_state": lyrics_state,
            "artist_name": new_track.artist_name,
            "song_title": new_track.title,
            "album_cover_url": new_track.album_cover_url,
            "mp3_path": new_track.mp3_url,
            "peaks": new_track.peaks,
            "duration": new_track.duration
        })}\n\n'

    return StreamingResponse(event_generator(), media_type="text/event-stream")
