import asyncio
import json
import pprint

from sqlalchemy import select

from backend.dao.base import BaseDAO
from backend.sessions.models import Sessions
from backend.tracks.models import Tracks
from backend.dao.creator import async_sessionmaker


class TracksDAO(BaseDAO):
    model = Tracks

    @classmethod
    async def change_lyrics_state(cls, session_id, section_index, line_index, word_index):
        async with async_sessionmaker() as session:
            querry = select(cls.model, Sessions).join(cls.model).filter(Sessions.id == session_id)
            result = await session.execute(querry)
            track: Tracks = result.scalars().first()


            # Получаем lyrics из трека
            server_lyrics = json.loads(track.lyrics)['lyrics']


            # Получаем название части трека
            song_part_title = list(server_lyrics[section_index].keys())[0]


            # Изменяем состояние filled на True
            server_lyrics[section_index][song_part_title][line_index][word_index]['filled'] = True

            # Обновляем
            track.lyrics = json.dumps({'lyrics': server_lyrics})

            # Сохраняем изменения
            await session.commit()


if __name__ == '__main__':
    asyncio.run(TracksDAO.change_lyrics_state(25, 1, '1', '1'))
