import asyncio
import json

from backend.dao.base import BaseDAO
from backend.dao.creator import async_sessionmaker
from backend.lyrics_states.models import LyricsStates
from backend.sessions.models import Sessions
from backend.tracks.models import Tracks
from sqlalchemy import select, desc


class SessionsDAO(BaseDAO):
    model = Sessions

    @classmethod
    async def find_all_session_and_tracks_by_user_id(cls, user_id):
        async with (async_sessionmaker() as session):
            query = select(cls.model, Tracks).join(
                Tracks, cls.model.track_id == Tracks.id).filter(
                cls.model.user_id == user_id).order_by(desc(cls.model.created_date))
            result = await session.execute(query)
            return result.all()

    @classmethod
    async def find_session_data(cls, session_id):
        async with (async_sessionmaker() as session):
            query = select(cls.model, Tracks, LyricsStates).join(
                Tracks, cls.model.track_id == Tracks.id).join(
                LyricsStates, cls.model.lyrics_state_id == LyricsStates.id).filter(
                cls.model.id == session_id)
            result = await session.execute(query)
            return result.one_or_none()


if __name__ == '__main__':
    async def eee():
        b, c, d = await SessionsDAO.find_session_data(4)
    asyncio.run(eee())
