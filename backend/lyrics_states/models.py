from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, DateTime, JSON

from backend.dao.creator import Base


class LyricsStates(Base):
    __tablename__ = 'lyrics_states'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    last_change_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    lyrics_state: Mapped[str] = mapped_column(JSON)
