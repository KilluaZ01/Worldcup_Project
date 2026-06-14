from pydantic import BaseModel


class BettorValue(BaseModel):
    bettor: str
    value: float


class StatsRead(BaseModel):
    totalBets: int
    totalMatches: int
    mostSelectedTeam: str
    longestWinStreak: int
    highestProfit: BettorValue
    bettingAccuracy: float
    biggestWin: BettorValue
