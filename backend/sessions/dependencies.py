import asyncio
import json
import pprint
import random
import re
import string
import uuid
from random import choice

from requests.exceptions import SSLError, Timeout
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from lyricsgenius.types import Song
from lyricsgenius import Genius
from yandex_music import ClientAsync

from backend.config import settings

import unicodedata

from backend.lyrics_states.dependencies import create_lyrics_state


async def take_selector_type(artist_name='', song_title=''):
    if not artist_name and not song_title:
        return 'random'
    elif artist_name and not song_title:
        return 'artist'
    elif song_title and not artist_name:
        return 'song_title'
    return 'both'


async def sse_resp_wrapper(response_text):
    return f'data: {json.dumps({"status": response_text})}\n\n'


class SongsApi:
    spotify_client = spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(client_id=settings.SPOTIFY_CLIENT_ID,
                                              client_secret=settings.SPOTIFY_CLIENT_SECRET, ))
    genius_client = Genius(settings.GENIUS_TOKEN)
    genius_client.verbose = False

    @classmethod
    async def _split_lyrics(cls, lyrics) -> (list, int):
        # print(lyrics)
        # Регулярное выражение для поиска частей текста с заголовками и содержимым
        matches = re.findall(r'\[(.*?)](.*?)(?=\[\w|\Z)', lyrics, re.DOTALL)

        # Создание списка словарей
        result = [{match[0]: match[1].strip()} for match in matches]

        # print(result)

        # Считаем количество слов
        word_count = 0

        for song_part in result:
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

        return result, word_count

    @classmethod
    async def get_track_lyrics(cls, artist_name: str, song_name: str):
        song: None | Song = None

        try:
            song = cls.genius_client.search_song(song_name, artist_name)
        except (SSLError, Timeout):
            print('Ошибка соединения, повторная попытка через 5 секунд...')
            await asyncio.sleep(5)
            await cls.get_track_lyrics(artist_name, song_name)

        if song:
            if all((
                    "verse" in song.lyrics.lower(),
                    "chorus" in song.lyrics.lower(),
                    '[' in song.lyrics,
                    ']' in song.lyrics,
            )):
                # print(song.lyrics)
                lyrics = unicodedata.normalize('NFKD', song.lyrics)
                result = await cls._split_lyrics(lyrics)
                print(f'Genius - {artist_name} - {song_name} - Слова найдены')
                return result
            else:
                print(f'Genius - {artist_name} - {song_name} - '
                      f'Плохие слова')
                return None, None
        else:
            print(f'Genius - {artist_name} - {song_name} - Трек не найден')
            return None, None

    @staticmethod
    async def parse_spotify_song_json(song: dict):
        song_name: str = song['name']

        # print(song_name)

        # Замена *Year Remaster* на пустую строку
        result = re.sub(r" -\s*\d{4}\s*Remaster$", "", song_name, flags=re.IGNORECASE)

        # Замена других ненужных слов
        bad_words = ['Instrumental', 'demo', 'remaster', '(feat', 'live', 'Symphonicities']
        for word in bad_words:
            if word.lower() in song_name.lower():
                song_name = song_name[:song_name.lower().index(word.lower())]

        while not song_name[-1].isalnum():
            song_name = song_name[:-1]

        artist_name = song['artists'][0]['name']
        image_url = song['album']['images'][1]['url']
        print(f"Spotify - {artist_name} - {song_name} - Трек выбран")
        # print(f'Популярность трека: {song['popularity']}')
        return artist_name, song_name, image_url

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

        popular_songs = list(filter(filter_params, songs))
        if popular_songs:
            song = random.choice(popular_songs)

        return song

    @classmethod
    async def download_mp3(cls, artist_name, song_name):
        yandex_client = await ClientAsync(settings.YM_TOKEN).init()

        text_to_search = ' '.join([artist_name, song_name])
        songs = await yandex_client.search(
            text=text_to_search,
            type_='track',
        )

        def filter_(song_: dict):
            return (
                    song_['artists'] and
                    song_['title'].lower() == song_name.lower() and
                    artist_name.lower() in song_['artists'][0]['name'].lower() and
                    'instrumental' not in song_['title'].lower()
            )

        if songs and songs['tracks']:
            songs = list(filter(filter_, songs['tracks']['results']))

            if songs:
                file_name = f'{str(uuid.uuid4())}.mp3'
                file_path = str(settings.MP3_FOLDER / file_name)
                await songs[0].download_async(file_path)
                print(f'YM - {artist_name} - {song_name} - Трек скачан')
                return file_name, file_path
        print(f'YM - {artist_name} - {song_name} - Трек не найден')
        return None, None


if __name__ == '__main__':
    async def main():
        # print(await SongsApi.parse_spotify_song_json(await SongsApi.get_song('Steve Miller Band', 'Abracadabra')))
        # pprint.pprint(await SongsApi.get_track_lyrics('Dire Straits', 'water of love'))
        # await SongsApi.get_track_lyrics('Dire Straits', 'water of love')
        pprint.pprint(await SongsApi.get_track_lyrics('Nirvana', 'Oh me'))


        # pprint.pprint(await SongsApi.download_mp3('sting', 'Englishman In New York'))


    asyncio.run(main())
