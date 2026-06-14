from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MatchBase(BaseModel):
    home_team: str
    away_team: str
    competition: str
    venue: str
    start_time: datetime
    status: str = Field(default="scheduled")
    winner: str | None = None
    external_id: str | None = None
    room_id: int | None = None


class MatchCreate(MatchBase):
    pass


class MatchRead(MatchBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
