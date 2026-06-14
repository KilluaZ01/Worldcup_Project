from collections import Counter, defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.all import Bet, Match
from app.services.leaderboard import calculate_leaderboard


def calculate_stats(db: Session, room_id: int) -> dict:
    matches = db.execute(select(Match).where(Match.room_id == room_id)).scalars().all()
    bets = db.execute(select(Bet).where(Bet.room_id == room_id)).scalars().all()
    leaderboard = calculate_leaderboard(db, room_id)

    team_counter = Counter(bet.selected_team for bet in bets)
    most_selected_team = team_counter.most_common(1)[0][0] if team_counter else ""

    streaks = defaultdict(int)
    best_streak = 0
    for match in sorted(
        (m for m in matches if m.status == "completed"),
        key=lambda item: item.start_time,
    ):
        winner = match.result.winning_team if match.result else match.winner
        if not winner:
            continue
        for bet in match.bets:
            if bet.selected_team == winner:
                streaks[bet.bettor] += 1
                best_streak = max(best_streak, streaks[bet.bettor])
            else:
                streaks[bet.bettor] = 0

    biggest_win_bettor = ""
    biggest_win_value = 0.0
    for match in sorted(
        (m for m in matches if m.status == "completed"),
        key=lambda item: item.start_time,
    ):
        winner = match.result.winning_team if match.result else match.winner
        if not winner:
            continue
        winning_bets = [bet for bet in match.bets if bet.selected_team == winner]
        if not winning_bets:
            continue
        match_biggest_bet = max(winning_bets, key=lambda bet: float(bet.amount))
        if float(match_biggest_bet.amount) > biggest_win_value:
            biggest_win_value = float(match_biggest_bet.amount)
            biggest_win_bettor = match_biggest_bet.bettor

    highest_profit_bettor = ""
    highest_profit_value = 0.0
    biggest_win_bettor = ""
    biggest_win_value = 0.0
    betting_accuracy = 0.0

    if leaderboard:
        highest_profit_bettor, highest_profit_entry = max(
            leaderboard.items(), key=lambda item: item[1]["profit"]
        )
        biggest_win_bettor, biggest_win_entry = max(
            leaderboard.items(), key=lambda item: item[1]["wins"]
        )
        highest_profit_value = highest_profit_entry["profit"]
        biggest_win_value = max(highest_win_entry["profit"], 0.0)
        total_predictions = sum(
            entry["wins"] + entry["losses"] for entry in leaderboard.values()
        )
        total_wins = sum(entry["wins"] for entry in leaderboard.values())
        betting_accuracy = (
            round((total_wins / total_predictions) * 100, 1)
            if total_predictions
            else 0.0
        )

    return {
        "totalBets": len(bets),
        "totalMatches": len(matches),
        "mostSelectedTeam": most_selected_team,
        "longestWinStreak": best_streak,
        "highestProfit": {
            "bettor": highest_profit_bettor,
            "value": round(highest_profit_value, 2),
        },
        "bettingAccuracy": betting_accuracy,
        "biggestWin": {
            "bettor": biggest_win_bettor,
            "value": round(biggest_win_value, 2),
        },
    }
