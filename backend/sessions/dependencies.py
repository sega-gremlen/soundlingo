import asyncio
import json
import math
import pprint
import random
import re
import string
import uuid
from random import choice
import unicodedata

from requests.exceptions import SSLError, Timeout
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from lyricsgenius import Genius
from yandex_music import ClientAsync
import yt_dlp
import librosa
import numpy as np
from yt_dlp.YoutubeDL import DownloadError
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from backend.config import settings


async def sse_resp_wrapper(response_text):
    return f'data: {json.dumps({"status": response_text})}\n\n'


class SongsApi:
    """ Класс для взаимодейсвтия с аудио"""

    spotify_client = spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(client_id=settings.SPOTIFY_CLIENT_ID,
                                              client_secret=settings.SPOTIFY_CLIENT_SECRET, ))
    genius_client = Genius(settings.GENIUS_TOKEN)
    genius_client.verbose = False

    @classmethod
    async def _split_lyrics(cls, lyrics) -> (list, int):
        """ Преобразование слов в json-подобный формат, где каждая часть, строка, слово
        это отдельный словарь с данными

        """

        # Регулярное выражение для поиска частей текста с заголовками и содержимым
        matches = re.findall(r'\[(.*?)](.*?)(?=\[\w|\Z)', lyrics, re.DOTALL)

        # Создание списка словарей
        lyrics = [{match[0]: match[1].strip()} for match in matches]

        # Считаем количество слов
        word_count = 0

        for song_part in lyrics:
            for song_part_name, rows in song_part.items():
                song_part[song_part_name] = {i: k for i, k in enumerate(rows.split('\n'))}
                for row in song_part[song_part_name].keys():
                    row_dict = {}
                    for i, word in enumerate(song_part[song_part_name][row].split(' ')):
                        new_word_form = {
                            'value': word,
                            # 'filled': False
                        }
                        row_dict[i] = new_word_form
                        if word:
                            word_count += 1
                    song_part[song_part_name][row] = row_dict

        # await create_lyrics_state(result)

        return lyrics, word_count

    @classmethod
    async def get_track_lyrics(cls,
                               spotify_artist_name: str,
                               spotify_song_name: str,
                               rq_artist_name: str,
                               rq_song_name: str) -> dict:

        """ Парсинг ответа Genius """
        result = {
            'lyrics': None,
            'word_count': None,
            'url': None
        }

        async def search_song(artist_name: str, song_name: str):
            try:
                return cls.genius_client.search_song(song_name, artist_name)
            except (SSLError, Timeout):
                print(f'Ошибка соединения с Genius, повторная попытка через 5 секунд...')
                await asyncio.sleep(5)
                return await search_song(artist_name, song_name)  # Рекурсивный повтор запроса

        # Первый поиск
        song = await search_song(spotify_artist_name, spotify_song_name)

        # Если первый поиск не дал результата, пробуем второй раз с rq_данными
        if not song:
            print(f'Genius - {spotify_artist_name} - {spotify_song_name} - Трек не найден, пробуем другой вариант...')
            song = await search_song(rq_artist_name, rq_song_name)

        # Если после второго поиска трек всё равно не найден — завершаем
        if not song:
            print(f'Genius - {rq_artist_name} - {rq_song_name} - Трек не найден (второй попыткой)')
            return result

        # Проверяем качество найденных слов
        if all((
                "verse" in song.lyrics.lower(),
                "chorus" in song.lyrics.lower(),
                '[' in song.lyrics,
                ']' in song.lyrics,
        )):
            lyrics = unicodedata.normalize('NFKD', song.lyrics)
            result['lyrics'], result['word_count'] = await cls._split_lyrics(lyrics)
            result['url'] = song.url
            print(f'Genius - {song.artist} - {song.title} - Слова найдены')
        else:
            print(f'Genius - {song.artist} - {song.title} - Плохие слова')

        return result

    @staticmethod
    async def parse_spotify_song_json(song: dict) -> dict:
        """ Парсит ответ spotify:
        - Название трека
        - Исполнитель
        - Ссылка на обложку альбома
        - ID трека
        - Сылка на трек

        Обрабатывает название трека для более удачного дальнейшего поиска слов и mp3

        :param song: трек в формате ответа spotify api

        :return: данные spotify
        """

        result = {
            'song_title': None,
            'artist_name': None,
            'album_cover_url': None,
            'spotify_id': None,
            'url': None,
        }

        song_name: str = song['name']

        # Замена *Year Remaster* на пустую строку
        # result = re.sub(r" -\\s*\\d{4}\\s*Remaster$", "", song_name, flags=re.IGNORECASE)

        # Замена других ненужных слов
        bad_words = ['Instrumental',
                     'demo',
                     'remaster',
                     '(feat', 
                     'live',
                     'Symphonicities',
                     '(',
                     'Radio edit',
                     ]
        for word in bad_words:
            if word.lower() in song_name.lower():
                song_name = song_name[:song_name.lower().index(word.lower())]

        # Удаление всех небуквенных симоволов в конце строки:
        while not song_name[-1].isalnum():
            song_name = song_name[:-1]

        result['song_title'] = song_name
        result['artist_name'] = ', '.join([i['name'] for i in song['artists']])
        result['album_cover_url'] = song['album']['images'][1]['url']
        result['spotify_id'] = song['id']
        result['url'] = song['external_urls']['spotify']
        print(f"Spotify - {song['artists'][0]['name']} - {song_name} - Трек выбран")

        return result

    @classmethod
    async def get_song(cls, artist_name: str = '', song_name: str = ''):
        song = None
        offset = 0

        q = []
        if song_name:
            q.append(f'track:{song_name}')
        if artist_name:
            q.append(f'artist:{artist_name}')
        q = ' '.join(q)

        if not song_name and not artist_name:
            genres = [
                'country',
                'disco',
                'hip-hop',
                'indie',
                'pop',
                'r-n-b',
                'rock',
            ]

            rndm_genre = choice(genres)
            rndm_char = choice(string.ascii_lowercase)

            q = f'track:{rndm_char}% genre:{rndm_genre}'

            offset = random.randint(0, 5)

        # print(q)

        songs = cls.spotify_client.search(q=q, limit=50, offset=offset)['tracks']['items']

        def filter_params(song_: dict):
            if artist_name:
                return song_['popularity'] > 30 and artist_name.lower() in song_['artists'][0]['name'].lower()
            else:
                return song_['popularity'] > 30

        if not song_name and not artist_name:
            popular_songs = list(filter(filter_params, songs))
            if popular_songs:
                song = random.choice(popular_songs)
            return song
        elif not song_name and artist_name:
            print('we are here')
            return songs[random.randint(0, len(songs) - 1)]
        else:
            return songs[0]

    @classmethod
    async def get_mp3_from_ym(cls,
                              spotify_artist_name: str,
                              spotify_song_name: str,
                              rq_artist_name: str,
                              rq_song_name: str) -> dict:
        """
        Поиск и загрузка mp3 на YM в папку settings.MP3_FOLDER
        """

        yandex_client = await ClientAsync(settings.YM_TOKEN).init()

        async def search_and_download(artist: str, song: str):
            """Функция для поиска и загрузки трека"""

            text_to_search = f"{artist} {song}"
            songs = await yandex_client.search(text=text_to_search, type_='track')

            def filter_(song_: dict):
                return (
                        song_['artists'] and
                        song.lower() in song_['title'].lower() and
                        artist.lower() in song_['artists'][0]['name'].lower() and
                        'instrumental' not in song_['title'].lower()
                )

            if songs and songs['tracks']:
                filtered_songs = list(filter(filter_, songs['tracks']['results']))
                if filtered_songs:
                    file_name = f"{uuid.uuid4()}.mp3"
                    file_path = str(settings.MP3_FOLDER / file_name)
                    url = f"https://music.yandex.ru/album/{filtered_songs[0]['albums'][0]['id']}/track/{filtered_songs[0]['id']}"
                    await filtered_songs[0].download_async(file_path)
                    return {
                        'file_name': file_name,
                        'file_path': file_path,
                        'url': url
                    }
            return None  # Вернем None, если ничего не найдено

        # Пробуем искать первый раз
        result = await search_and_download(spotify_artist_name, spotify_song_name)

        # Если не нашли, пробуем с альтернативными данными
        if not result:
            print(f'YM - {spotify_artist_name} - {spotify_song_name} - Трек не найден, пробуем другой вариант...')
            result = await search_and_download(rq_artist_name, rq_song_name)

        # Если и второй поиск не дал результата
        if not result:
            print(f'YM - {rq_artist_name} - {rq_song_name} - Трек не найден (второй попыткой)')
            return {
                'file_name': None,
                'file_path': None,
                'url': None
            }

        print(f'YM - {result["file_name"]} - Трек скачан')
        return result

    @classmethod
    async def get_mp3_from_youtube(cls,
                                   spotify_artist_name: str,
                                   spotify_song_name: str,):
        """
        Скачивает с ютуба первый ролик в выдаче по данному реквесту и преобразовывает в mp3


        """
        result = {
            'file_name': None,
            'file_path': None,
            'url': None,
            'peaks': None,
            'duration': None,
        }

        search_ydl_opts = {
            'quiet': True,
            'default_search': 'ytsearch',
            'max_downloads': 1,
        }

        query = f'{spotify_artist_name} {spotify_song_name}'

        with yt_dlp.YoutubeDL(search_ydl_opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if 'entries' in info and info['entries']:
                video_url = info['entries'][0]['webpage_url']

        file_name = f"{uuid.uuid4()}"
        file_path = str(settings.MP3_FOLDER / file_name)

        @retry(stop=stop_after_attempt(5),  # Максимум 5 попыток
               wait=wait_exponential(multiplier=1, min=4, max=10),  # Экспоненциальная задержка
               retry=retry_if_exception_type(DownloadError),)  # Повторять при любых исключениях
        async def download_mp3():
            """
            Непосредственно сама операция загрузки. Сделано отедльно для повторных попыток
            из-за частых ошибок именно при загрузке.
            """
            download_ydl_opts = {
                'format': 'bestaudio/best',
                # 'ffmpeg_location': r'C:\\ffmpeg\\bin\\ffmpeg.exe',
                'outtmpl': file_path,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '320',
                }],
                'noplaylist': True,  # Отключает загрузку плейлистов, если в ссылке есть плейлист
                'extractaudio': True,  # Гарантирует, что будет скачан только аудио файл
                'extract_flat': True,  # Отключает получение информации о плеере
            }
            with yt_dlp.YoutubeDL(download_ydl_opts) as ydl:
                ydl.download([video_url])

        try:
            await download_mp3()
        except DownloadError:
            print("Неудачная попытка загрузить трек")
            return result

        print(f'YouTube - {spotify_artist_name} {spotify_song_name} - Трек скачан')
        result['file_name'] = file_name + '.mp3'
        result['file_path'] = file_path + '.mp3'
        result['url'] = video_url
        result['peaks'], result['duration'] = await cls._process_audio(result['file_path'])
        return result

    @classmethod
    async def _process_audio(cls, file_path, target_width=800) -> (list, int):
        """
        Извлекаем данные из аудио-файла для плеера на фронте:
        - частотные пики для построения спектрограммы
        - длительность трека

        :param file_path: путь к аудио-файлу
        :param target_width: количество построенных пиков на трек

        :return: dict со списком пиков и длительностью треков
        """

        print('Строим пики...')

        # Загружаем аудио как моно-сигнал
        y, sr = librosa.load(file_path, sr=None, mono=True)

        # Длительность аудио
        duration = math.ceil(librosa.get_duration(y=y, sr=sr))

        # Вычисляем количество сэмплов на пиксель/точку
        samples_per_pixel = max(1, int(len(y) / target_width))

        # Разбиваем сигнал на чанки
        chunks = [y[i:i + samples_per_pixel] for i in range(0, len(y), samples_per_pixel)]

        # Для каждого чанка находим максимум и минимум
        peaks = []
        for chunk in chunks:
            if len(chunk) == 0:
                continue
            max_val = np.max(chunk)
            min_val = np.min(chunk)
            peaks.append(min_val)
            peaks.append(max_val)

        # Нормализация к диапазону [-1, 1]
        max_abs = max(np.max(np.abs(peaks)), 1e-6)
        peaks = np.clip(np.array(peaks) / max_abs, -1, 1)

        # Конвертация в список и округление для компактности
        peaks = [round(float(p), 3) for p in peaks]

        return peaks, duration


if __name__ == '__main__':
    async def main():
        ...
        # print(await SongsApi.parse_spotify_song_json(await SongsApi.get_song('Steve Miller Band', 'Abracadabra')))
        # pprint.pprint(await SongsApi.get_track_lyrics('Dire Straits', 'water of love'))
        # await SongsApi.get_track_lyrics('Dire Straits', 'water of love')
        # pprint.pprint(await SongsApi.get_track_lyrics('Nirvana', 'Oh me'))

        # song = await SongsApi.get_song(artist_name='NXCRE', song_name='Usurper')
        # pprint.pprint(song)
        # await SongsApi.parse_spotify_song_json(song)

        # await SongsApi.download_mp3('justin timberlake', 'around')
        await SongsApi.get_track_lyrics('Ms. Lauryn Hill',
                                        'Final Hour',
                                        'Ms. Lauryn Hill',
                                        'Final Hour')

        # pprint.pprint(await SongsApi.get_mp3_from_ym('Justin Timberlake',
        #                                              'What Goes Around.../...Comes Around',
        #                                              'justin timberlake',
        #                                              'around'))

        # pprint.pprint(await SongsApi.get_mp3_from_youtube('NXCRE',
        #                                                   'Usurper'))



    asyncio.run(main())
