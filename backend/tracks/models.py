from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, JSON

from backend.dao.creator import Base


class Tracks(Base):
    __tablename__ = 'tracks'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    artist_name: Mapped[str] = mapped_column(nullable=False)
    title: Mapped[str] = mapped_column(nullable=False)
    lyrics: Mapped[str] = mapped_column(JSON)
    mp3_url: Mapped[str] = mapped_column(nullable=False)
    album_cover_url: Mapped[str] = mapped_column(nullable=False)
    word_count: Mapped[int] = mapped_column(nullable=False)
