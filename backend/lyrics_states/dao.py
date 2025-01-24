import asyncio
import json
from typing import Tuple

from sqlalchemy import select

from backend.dao.base import BaseDAO
from backend.sessions.models import Sessions
from backend.lyrics_states.models import LyricsStates
from backend.dao.creator import async_sessionmaker


class LyricsStatesDAO(BaseDAO):
    model = LyricsStates

    @classmethod
    async def process_word_info(cls, session_id, section_index, line_index, word_index, word_value, revealed, valid):
        """ Функция для обработки слова введенного пользователем"""

        async with async_sessionmaker() as session:
            querry = select(cls.model, Sessions).join(
                Sessions, Sessions.lyrics_state_id == cls.model.id).filter(
                Sessions.id == session_id)

            result = await session.execute(querry)
            result: Tuple[LyricsStates, Sessions] = result.tuples().first()
            lyrics_state, my_session = result

            # Изменяем колчество очков в сессии
            if not revealed and valid:
                my_session.valid_points += 1
            elif revealed:
                my_session.revealed_points += 1

            # Получаем lyrics из трека
            server_lyrics_state = json.loads(lyrics_state.lyrics_state)['lyrics_state']

            # print(server_lyrics_state)

            # Изменяем свойства слова
            server_lyrics_state[section_index][line_index][word_index]['value'] = word_value

            if revealed:
                server_lyrics_state[section_index][line_index][word_index]['revealed'] = True

            print(server_lyrics_state[section_index][line_index][word_index])

            # Обновляем в бд
            lyrics_state.lyrics_state = json.dumps({'lyrics_state': server_lyrics_state})

            # Сохраняем изменения
            await session.commit()

            return {
                'all_points': my_session.all_points,
                'valid_points': my_session.valid_points,
                'revealed_points': my_session.revealed_points,
            }


if __name__ == '__main__':
    async def eee():
        await LyricsStatesDAO.process_word_info(12,
                                                '0',
                                                '0',
                                                '0',
                                                'jopa',
                                                False,
                                                False
                                                )

    asyncio.run(eee())

