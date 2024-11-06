from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, DateTime, JSON, ARRAY

from backend.dao.creator import Base


class Tracks(Base):
    __tablename__ = 'tracks'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # duration: Mapped[int] = mapped_column(default=None)

    rq_artist_name: Mapped[str] = mapped_column(default=None)
    artist_name: Mapped[str] = mapped_column(default=None)
    rq_title: Mapped[str] = mapped_column(default=None)
    title: Mapped[str] = mapped_column(default=None)
    lyrics: Mapped[str] = mapped_column(JSON)
