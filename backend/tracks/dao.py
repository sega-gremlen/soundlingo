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


if __name__ == '__main__':
    a = asyncio.run(TracksDAO.find_one_or_none(Tracks.artist_name == 'Jim Croce',
                                               Tracks.title == 'Time in a Bottle', ))

    print(a)
