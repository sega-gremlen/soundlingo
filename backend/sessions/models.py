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
    lyrics_state_id: Mapped[int] = mapped_column(ForeignKey('lyrics_states.id'))
    session_request_id: Mapped[int] = mapped_column(ForeignKey('session_requests.id'))
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # uuid: Mapped[str] = mapped_column(UUID(as_uuid=True), default=uuid.uuid4)
    all_points: Mapped[int] = mapped_column()
    valid_points: Mapped[int] = mapped_column(default=0,)
    revealed_points: Mapped[int] = mapped_column(default=0,)
