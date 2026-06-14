from __future__ import annotations

from datetime import datetime, timezone

import httpx


class SportsAPIClient:
    def __init__(self, base_url: str, api_key: str, league: str, season: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.league = league
        self.season = season

    async def fetch_upcoming_matches(self) -> list[dict]:
        if not self.base_url or not self.api_key:
            return []

        headers = {"x-apisports-key": self.api_key}
        params = {"league": self.league, "season": self.season, "next": 20}
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.base_url}/fixtures", headers=headers, params=params)
            response.raise_for_status()
            payload = response.json()

        matches: list[dict] = []
        for item in payload.get("response", []):
            fixture = item.get("fixture", {})
            teams = item.get("teams", {})
            venue = fixture.get("venue", {})
            matches.append(
                {
                    "external_id": str(fixture.get("id")),
                    "home_team": teams.get("home", {}).get("name", ""),
                    "away_team": teams.get("away", {}).get("name", ""),
                    "competition": item.get("league", {}).get("name", ""),
                    "venue": venue.get("name", ""),
                    "start_time": datetime.fromisoformat(fixture.get("date").replace("Z", "+00:00")),
                    "status": "scheduled" if fixture.get("status", {}).get("short") == "NS" else "live",
                    "winner": None,
                }
            )
        return matches
