import asyncio

from backend.dao.base import BaseDAO
from backend.dao.creator import async_sessionmaker
from backend.sessions.models import Sessions
from backend.users.models import Users

from typing import Tuple

from sqlalchemy import select


class UsersDAO(BaseDAO):
    model = Users

    @classmethod
    async def get_users_sessions(cls) -> list:
        """ Функция для получения объектов всех пользователей и их сессий """

        async with async_sessionmaker() as session:
            querry = select(cls.model, Sessions).join(Sessions)

            result = await session.execute(querry)
            result: Tuple[Users, Sessions] = result.tuples().all()

            return result


if __name__ == '__main__':
    async def eee():
        await UsersDAO.get_users_sessions()

    asyncio.run(eee())

