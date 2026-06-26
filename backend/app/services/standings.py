from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.all import Match


def calculate_standings(db: Session) -> dict[str, list[dict]]:
    matches = db.execute(select(Match).where(Match.group.isnot(None))).scalars().all()

    groups: dict[str, dict[str, dict]] = defaultdict(dict)

    def ensure_team(group: str, team: str):
        if team not in groups[group]:
            groups[group][team] = {
                "team": team,
                "played": 0,
                "won": 0,
                "drawn": 0,
                "lost": 0,
                "goals_for": 0,
                "goals_against": 0,
                "goal_diff": 0,
                "points": 0,
            }

    for match in matches:
        group = match.group
        ensure_team(group, match.home_team)
        ensure_team(group, match.away_team)

        if (
            match.status != "finished"
            or match.home_score is None
            or match.away_score is None
        ):
            continue

        home = groups[group][match.home_team]
        away = groups[group][match.away_team]

        home["played"] += 1
        away["played"] += 1
        home["goals_for"] += match.home_score
        home["goals_against"] += match.away_score
        away["goals_for"] += match.away_score
        away["goals_against"] += match.home_score

        if match.home_score > match.away_score:
            home["won"] += 1
            home["points"] += 3
            away["lost"] += 1
        elif match.away_score > match.home_score:
            away["won"] += 1
            away["points"] += 3
            home["lost"] += 1
        else:
            home["drawn"] += 1
            away["drawn"] += 1
            home["points"] += 1
            away["points"] += 1

    result: dict[str, list[dict]] = {}
    for group, teams in groups.items():
        for t in teams.values():
            t["goal_diff"] = t["goals_for"] - t["goals_against"]
        ranked = sorted(
            teams.values(),
            key=lambda t: (-t["points"], -t["goal_diff"], -t["goals_for"]),
        )
        result[group] = ranked

    return result
