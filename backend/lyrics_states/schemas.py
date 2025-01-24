from datetime import datetime
from pydantic import BaseModel


class SLyricsStates(BaseModel):
    id: int
    last_change_date: datetime
    state: dict
