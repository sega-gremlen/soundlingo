from datetime import datetime

import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, DateTime, ForeignKey, UUID, Enum

from backend.dao.creator import Base


class Sessions(Base):
    __tablename__ = 'sessions'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    track_id: Mapped[int] = mapped_column(ForeignKey('tracks.id'))
    # uuid: Mapped[str] = mapped_column(UUID(as_uuid=True), default=uuid.uuid4)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration: Mapped[int] = mapped_column(default=None)
    selector_type: Mapped[str] = mapped_column(
        Enum('random', 'artist', 'song_title', 'both',
             name='selector_enum'),
        nullable=False)
