import asyncio

from backend.dao.base import BaseDAO
from backend.dao.creator import async_sessionmaker
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


if __name__ == '__main__':
    async def test():
        a = await SessionsDAO.find_all_session_and_tracks_by_user_id(5)
        res = a
        print(len(res))
        for sess in res:
            print(sess)

    asyncio.run(test())
