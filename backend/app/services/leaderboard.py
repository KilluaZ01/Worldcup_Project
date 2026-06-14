from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.all import Bet, Match, Result


def calculate_leaderboard(db: Session, room_id: int) -> dict[str, dict[str, float]]:
    completed_matches = db.execute(
        select(Match).where(Match.room_id == room_id, Match.status == "completed")
    ).scalars().all()

    wins = defaultdict(int)
    losses = defaultdict(int)
    profit = defaultdict(float)
    balances = defaultdict(float)

    for match in completed_matches:
        result = match.result
        if result is None and match.winner is None:
            continue
        winning_team = result.winning_team if result is not None else match.winner
        bets = db.execute(select(Bet).where(Bet.match_id == match.id, Bet.room_id == room_id)).scalars().all()

        for bet in bets:
            if bet.selected_team == winning_team:
                wins[bet.bettor] += 1
                profit[bet.bettor] += float(bet.amount)
                balances[bet.bettor] += float(bet.amount)
            else:
                losses[bet.bettor] += 1
                profit[bet.bettor] -= float(bet.amount)
                balances[bet.bettor] -= float(bet.amount)

    bettors = sorted(set(wins) | set(losses) | set(profit))
    leaderboard: dict[str, dict[str, float]] = {}
    for bettor in bettors:
        total = wins[bettor] + losses[bettor]
        win_rate = round((wins[bettor] / total) * 100, 1) if total else 0.0
        leaderboard[bettor] = {
            "wins": wins[bettor],
            "losses": losses[bettor],
            "profit": round(profit[bettor], 2),
            "winRate": win_rate,
            "balance": round(balances[bettor], 2),
        }
    return leaderboard
