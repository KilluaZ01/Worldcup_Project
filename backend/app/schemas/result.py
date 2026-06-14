from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ResultBase(BaseModel):
    match_id: int
    winning_team: str
    processed: bool = True
    room_id: int | None = None


class ResultCreate(ResultBase):
    pass


class ResultRead(ResultBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    processed_at: datetime
