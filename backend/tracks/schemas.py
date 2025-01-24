from datetime import datetime

from pydantic import BaseModel
from typing import Optional


class STrackCreate(BaseModel):
    id: int
    created_date: datetime
    artist_name: Optional[str] = None
    title: Optional[str] = None
    lyrics: Optional[dict] = None
