from __future__ import annotations

import asyncio
from datetime import datetime

from sqlalchemy import select

from app.core.database import SessionLocal, engine
from app.core.settings import get_settings
from app.models import all as _models  # noqa: F401
from app.models.match import Match
from app.models.room import Room
from app.services.sports_api import SportsAPIClient


def get_default_room(db):
    room = db.execute(select(Room).where(Room.code == "DEFAULT")).scalar_one_or_none()
    if room is None:
        room = Room(code="DEFAULT", name="Default Room")
        db.add(room)
        db.commit()
        db.refresh(room)
    return room


async def main() -> None:
    settings = get_settings()
    client = SportsAPIClient(
        base_url=settings.sports_api_url,
        api_key=settings.sports_api_key,
        league=settings.sports_api_league,
        season=settings.sports_api_season,
    )
    fetched_matches = await client.fetch_upcoming_matches()

    db = SessionLocal()
    try:
        room = get_default_room(db)
        for item in fetched_matches:
            external_id = item.get("external_id")
            if external_id:
                existing = db.execute(
                    select(Match).where(
                        Match.room_id == room.id, Match.external_id == external_id
                    )
                ).scalar_one_or_none()
                if existing is not None:
                    existing.home_team = item["home_team"]
                    existing.away_team = item["away_team"]
                    existing.competition = item["competition"]
                    existing.venue = item["venue"]
                    existing.start_time = item["start_time"]
                    existing.status = item["status"]
                    existing.winner = item.get("winner")
                    continue

            db.add(
                Match(
                    room_id=room.id,
                    home_team=item["home_team"],
                    away_team=item["away_team"],
                    competition=item["competition"],
                    venue=item["venue"],
                    start_time=item["start_time"],
                    status=item["status"],
                    winner=item.get("winner"),
                    external_id=external_id,
                )
            )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
