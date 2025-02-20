import asyncio

from sqlalchemy import select

from backend.dao.base import BaseDAO
from backend.tracks.models import Tracks
from backend.dao.creator import async_sessionmaker


class TracksDAO(BaseDAO):
    model = Tracks

    @classmethod
    async def find_existing_tracks(cls, spotify_id: str, artist_name: str, track_title: str) -> Tracks:
        """ Запрос для поиска уже добавленных в бд треков.
        В бд spotify может быть несколько одинаковых треков с разным spotify_id, поэтому
        дополнительно ищем по артисту и названию трека.

        :param spotify_id: ID трека в Spotify
        :param artist_name: Имя артиста или название группы
        :param track_title: Название трека

        :return: Tracks

        """
        async with async_sessionmaker() as session:
            querry = select(cls.model).where(cls.model.spotify_id == spotify_id)
            result = await session.execute(querry)
            result = result.scalar_one_or_none()
            if not result:
                querry = select(cls.model).where(cls.model.artist_name == artist_name,
                                                 cls.model.title == track_title)
                result = await session.execute(querry)
                result = result.scalar_one_or_none()
            return result


if __name__ == '__main__':
    a = asyncio.run(
        TracksDAO.find_existing_tracks()
    )

    print(a)
