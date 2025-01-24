import pprint


async def create_lyrics_state(track_lyrics_data: list) -> dict:
    """
    Функция для создания состояния заполненных юзером слов

    Приходит такой тип данных:
    track_lyrics_data = [{
        'Название части трека': {
            'Порядковый номер строки': {
                'Порядковый номер слова': {
                    'value': "само слово",
                }
            }
        }
    }]

    Выходит такой словарь:
    result = {
        'Порядковый номер части трека': {
            'Порядковый номер строки части трека': {
                'Порядковый номер слова': 'Само слово',
            },
        },
    }

    """



    # track_lyrics_data = track_lyrics_data['lyrics']
    # pprint.pprint(track_lyrics_data)

    result = {}

    for track_part_index, track_part in enumerate(track_lyrics_data):
        for rows_data in track_part.values():
            rows_indexes = {}
            for row_number, row_data in rows_data.items():
                words_indexes = {}
                for word_number, word_data in row_data.items():
                    words_indexes[word_number] = {
                        'value': '',
                        'revealed': False,
                    }
                rows_indexes[row_number] = words_indexes
            result[track_part_index] = rows_indexes

    return result
