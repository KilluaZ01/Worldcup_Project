from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BetBase(BaseModel):
    match_id: int
    bettor: str
    selected_team: str
    amount: float
    room_id: int | None = None
    is_initiator: bool = False


class BetCreate(BetBase):
    pass


class BetRead(BetBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PlaceBetRequest(BaseModel):
    match_id: int
    selected_team: str
    amount: float = 50
    room_id: int


class PlaceBetResponse(BaseModel):
    your_bet: BetRead
    opponent_bet: BetRead
