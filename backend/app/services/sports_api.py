from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

import httpx

WORLDCUP_JSON_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"

# Matches placeholder team codes like: "2A", "1E", "W74", "L101", "3A/B/C/D/F"
PLACEHOLDER_PATTERN = re.compile(r"^[123WL]\d*[A-Z/]*$")


def is_placeholder_team(name: str) -> bool:
    """Detect unresolved knockout-stage placeholders (e.g. '2A', 'W74', 'L101')."""
    return bool(PLACEHOLDER_PATTERN.match(name.strip()))


def parse_kickoff(date_str: str, time_str: str) -> datetime:
    """
    Parses date='2026-06-24', time='19:00 UTC-6' into an aware UTC datetime.
    """
    time_part, _, offset_part = time_str.partition(" UTC")
    hour, minute = map(int, time_part.split(":"))

    offset_hours = int(offset_part) if offset_part else 0
    tz = timezone(timedelta(hours=offset_hours))

    year, month, day = map(int, date_str.split("-"))
    local_dt = datetime(year, month, day, hour, minute, tzinfo=tz)
    return local_dt.astimezone(timezone.utc)


def make_external_id(team1: str, team2: str, date_str: str, round_name: str) -> str:
    """Deterministic ID since the source has no native unique ID for group matches."""
    raw = f"{round_name}:{team1}:{team2}:{date_str}"
    return raw.replace(" ", "_").lower()


class SportsAPIClient:
    def __init__(self) -> None:
        self.url = WORLDCUP_JSON_URL

    async def fetch_all_fixtures(self) -> list[dict]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.url)
            response.raise_for_status()
            payload = response.json()

        fixtures: list[dict] = []
        for item in payload.get("matches", []):
            team1 = item.get("team1", "")
            team2 = item.get("team2", "")

            if is_placeholder_team(team1) or is_placeholder_team(team2):
                continue  # skip unresolved knockout slots

            score = item.get("score", {}).get("ft")
            home_score = score[0] if score else None
            away_score = score[1] if score else None

            status = "finished" if score else "scheduled"

            winner = None
            if status == "finished":
                if home_score > away_score:
                    winner = team1
                elif away_score > home_score:
                    winner = team2
                else:
                    winner = "Draw"

            round_name = item.get("round", "")
            date_str = item.get("date", "")

            fixtures.append(
                {
                    "external_id": make_external_id(team1, team2, date_str, round_name),
                    "home_team": team1,
                    "away_team": team2,
                    "competition": f"World Cup 2026 — {item.get('group', round_name)}",
                    "group": item.get("group"),
                    "venue": item.get("ground", ""),
                    "start_time": parse_kickoff(
                        date_str, item.get("time", "00:00 UTC+0")
                    ),
                    "status": status,
                    "home_score": home_score,
                    "away_score": away_score,
                    "winner": winner,
                }
            )

        return fixtures
