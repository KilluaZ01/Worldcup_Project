from pydantic import BaseModel


class LeaderboardEntry(BaseModel):
    wins: int
    losses: int
    profit: float
    winRate: float
    balance: float
