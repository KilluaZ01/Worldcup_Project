from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.all import Bet, Match


def calculate_leaderboard(db: Session, room_id: int) -> dict[str, dict[str, float]]:
    bets_in_room = db.execute(select(Bet).where(Bet.room_id == room_id)).scalars().all()

    match_ids = {bet.match_id for bet in bets_in_room}
    finished_matches = {}
    if match_ids:
        matches = (
            db.execute(
                select(Match).where(Match.id.in_(match_ids), Match.status == "finished")
            )
            .scalars()
            .all()
        )
        finished_matches = {m.id: m for m in matches}

    wins = defaultdict(int)
    losses = defaultdict(int)
    profit = defaultdict(float)
    balances = defaultdict(float)

    for bet in bets_in_room:
        match = finished_matches.get(bet.match_id)
        if match is None:
            continue  # match not finished yet, skip

        winning_team = match.result.winning_team if match.result else match.winner
        if not winning_team:
            continue

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
