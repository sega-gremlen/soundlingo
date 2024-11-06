from pydantic import BaseModel
from typing import Optional


class SSessionCreate(BaseModel):
    user_id: int
    artist_name: Optional[str] = None
    song_name: Optional[str] = None
