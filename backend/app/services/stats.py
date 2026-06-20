from collections import Counter, defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.all import Bet, Match
from app.services.leaderboard import calculate_leaderboard


def calculate_stats(db: Session, room_id: int) -> dict:
    bets = db.execute(select(Bet).where(Bet.room_id == room_id)).scalars().all()

    match_ids = {bet.match_id for bet in bets}
    matches = []
    if match_ids:
        matches = (
            db.execute(select(Match).where(Match.id.in_(match_ids))).scalars().all()
        )

    leaderboard = calculate_leaderboard(db, room_id)

    team_counter = Counter(bet.selected_team for bet in bets)
    most_selected_team = team_counter.most_common(1)[0][0] if team_counter else ""

    finished_matches = sorted(
        (m for m in matches if m.status == "finished"),
        key=lambda item: item.start_time,
    )

    # Longest win streak per bettor, and biggest single winning bet
    streaks = defaultdict(int)
    best_streak = 0
    single_biggest_win_bettor = ""
    single_biggest_win_value = 0.0

    for match in finished_matches:
        winner = match.result.winning_team if match.result else match.winner
        if not winner:
            continue

        relevant_bets = [b for b in bets if b.match_id == match.id]
        winning_bets = [b for b in relevant_bets if b.selected_team == winner]

        for bet in relevant_bets:
            if bet.selected_team == winner:
                streaks[bet.bettor] += 1
                best_streak = max(best_streak, streaks[bet.bettor])
            else:
                streaks[bet.bettor] = 0

        if winning_bets:
            match_biggest_bet = max(winning_bets, key=lambda b: float(b.amount))
            if float(match_biggest_bet.amount) > single_biggest_win_value:
                single_biggest_win_value = float(match_biggest_bet.amount)
                single_biggest_win_bettor = match_biggest_bet.bettor

    highest_profit_bettor = ""
    highest_profit_value = 0.0
    betting_accuracy = 0.0

    if leaderboard:
        highest_profit_bettor, highest_profit_entry = max(
            leaderboard.items(), key=lambda item: item[1]["profit"]
        )
        highest_profit_value = highest_profit_entry["profit"]

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
            "bettor": single_biggest_win_bettor,
            "value": round(single_biggest_win_value, 2),
        },
    }
