import os
from datetime import datetime, UTC
from typing import List
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from backend.config import settings
from backend.lyrics_states.models import LyricsStates
from backend.sessions.dependencies import SongsApi
from backend.sessions.exceptions import TrackNotFoundError, LyricsOrSourceNotAvailableError, SessionFoundError
from backend.sessions.models import Sessions
from backend.sessions.dao import SessionsDAO
from backend.tracks.dao import TracksDAO
from backend.lyrics_states.dao import LyricsStatesDAO
from backend.lyrics_states.dependencies import create_lyrics_state
from backend.tracks.dependencies import S3Client
from backend.tracks.models import Tracks
from backend.users.dependencies import get_current_user, get_current_user_ws
from backend.users.models import Users
from backend.session_requests.dao import SessionRequestsDAO
from backend.session_requests.models import SessionRequests

practice_router = APIRouter()


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


@practice_router.get('/sessions/{session_id}')
async def get_session(user: Users = Depends(get_current_user), session_id: int = None):
    if user:
        session: Sessions = await SessionsDAO.find_one_or_none(Sessions.id == session_id)
        if session and session.user_id == user.id:
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


@practice_router.websocket("/sessions/{session_id}")
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


@practice_router.websocket("/create_session")
async def create_session(websocket: WebSocket, user: Users = Depends(get_current_user_ws)):
    await websocket.accept()
    query_params = websocket.query_params
    rq_artist_name = query_params.get("rq_artist_name")
    rq_song_name = query_params.get("rq_song_name")

    full_track_title = None
    existing_track = None
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
    youtube_data = {
        'file_name': None,
        'file_path': None,
        'url': None,
    }

    try:
        # Создаём запрос пользователя
        session_request: SessionRequests = await SessionRequestsDAO.create(
            user_id=user.id,
            created_date=datetime.now(UTC),
            rq_artist_name=rq_artist_name,
            rq_title=rq_song_name
        )

        while not (youtube_data['file_name'] and youtube_data['file_path'] and genius_data['lyrics']):
            song = await SongsApi.get_song(artist_name=rq_artist_name, song_name=rq_song_name)
            if not song and not rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "No tracks with this artist name or band title"})
                raise TrackNotFoundError
            elif not song and rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "No such track exists"})
                raise TrackNotFoundError

            spotify_data = await SongsApi.parse_spotify_song_json(song)

            existing_track: Tracks | None = await TracksDAO.find_existing_tracks(
                spotify_id=spotify_data['spotify_id'],
                artist_name=spotify_data['artist_name'],
                track_title=spotify_data['song_title'],
            )

            if existing_track:
                print('Retrieved from cache')
                full_track_title = f"{existing_track.artist_name} - {existing_track.title}"
                break

            full_track_title = f"{spotify_data['artist_name']} - {spotify_data['song_title']}"

            # Ищем слова
            await websocket.send_json({
                "status": f"{full_track_title}\n"
                "Looking for lyrics..."})
            genius_data = await SongsApi.get_track_lyrics(spotify_data['artist_name'],
                                                          spotify_data['song_title'],
                                                          rq_artist_name,
                                                          rq_song_name)
            if not genius_data['lyrics'] and not rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "Failed to find lyrics, trying another one track..."})
                continue
            elif not genius_data['lyrics'] and rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "No lyrics available, please try another one"})
                raise LyricsOrSourceNotAvailableError

            # Ищем mp3
            await websocket.send_json({
                "status": f"{full_track_title}\n"
                "Downloading mp3..."})
            youtube_data = await SongsApi.get_mp3_from_youtube(
                spotify_data['artist_name'],
                spotify_data['song_title'],
            )
            if not (youtube_data['file_name'] and youtube_data['file_path']) and not rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "Failed to download the track, trying another one track..."})
                continue
            elif not (youtube_data['file_name'] and youtube_data['file_path']) and rq_song_name:
                await websocket.send_json({
                    "status": f"{full_track_title}\n"
                    "No mp3 available, please try another one"})
                raise LyricsOrSourceNotAvailableError

        await websocket.send_json({
            "status": f"{full_track_title}\n"
            "Session is ready, final preparations..."})

        # Устанавливаем успешный статус реквесту
        await SessionRequestsDAO.patch(session_request, success=True)

        # Создаем шаблон для заполнения слов и загружаем mp3 на S3
        if existing_track:
            lyrics_state = await create_lyrics_state(json.loads(existing_track.lyrics)['lyrics'])
            mp3_s3_url = existing_track.mp3_url
        else:
            lyrics_state = await create_lyrics_state(genius_data['lyrics'])
            mp3_s3_url = f'{settings.CLOUDFRONT_DOMAIN}/{youtube_data['file_name']}'
            await S3Client.upload(f'{youtube_data['file_name']}', youtube_data['file_path'])
            os.remove(youtube_data['file_path'])

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

        await websocket.send_json({"status": "complete",
                                   "session_id": new_session.id})
        await websocket.close()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
