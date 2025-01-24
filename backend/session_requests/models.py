from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, DateTime, ForeignKey

from backend.dao.creator import Base


class SessionRequests(Base):
    __tablename__ = 'session_requests'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    rq_artist_name: Mapped[Optional[str]] = mapped_column(nullable=False)
    rq_title: Mapped[Optional[str]] = mapped_column(nullable=False)
    success: Mapped[bool] = mapped_column(default=False, nullable=False)
