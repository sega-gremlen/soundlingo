from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Identity, DateTime

from backend.dao.creator import Base


class Users(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Identity(always=True), primary_key=True)
    email: Mapped[str] = mapped_column(nullable=False, unique=True)
    password: Mapped[str | None] = mapped_column(nullable=True, default=None)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    nickname: Mapped[str | None] = mapped_column(nullable=False)
    is_verified: Mapped[bool] = mapped_column(nullable=False)
    uuid_email_verifying: Mapped[str | None] = mapped_column(nullable=True, default=None)
