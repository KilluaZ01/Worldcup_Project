import asyncio

from app.core.database import SessionLocal
from app.models.all import Match  # ← changed from app.models.match
from app.services.sports_api import SportsAPIClient
from sqlalchemy import select


async def sync_matches() -> None:
    client = SportsAPIClient()

    print("Fetching World Cup 2026 fixtures from openfootball...")
    fixtures = await client.fetch_all_fixtures()
    print(f"Confirmed fixtures (placeholders already skipped): {len(fixtures)}")

    db = SessionLocal()
    inserted = 0
    updated = 0
    unchanged = 0

    try:
        for fixture in fixtures:
            existing = db.execute(
                select(Match).where(Match.external_id == fixture["external_id"])
            ).scalar_one_or_none()

            if existing is None:
                match = Match(
                    external_id=fixture["external_id"],
                    home_team=fixture["home_team"],
                    away_team=fixture["away_team"],
                    competition=fixture["competition"],
                    venue=fixture["venue"],
                    start_time=fixture["start_time"],
                    status=fixture["status"],
                    home_score=fixture["home_score"],
                    away_score=fixture["away_score"],
                    winner=fixture["winner"],
                )
                db.add(match)
                inserted += 1
                continue

            if existing.status == "scheduled" and fixture["status"] == "finished":
                existing.status = "finished"
                existing.home_score = fixture["home_score"]
                existing.away_score = fixture["away_score"]
                existing.winner = fixture["winner"]
                updated += 1
            else:
                unchanged += 1

        db.commit()
        print(
            f"Inserted: {inserted} | Updated (newly finished): {updated} | Unchanged: {unchanged}"
        )

    except Exception as e:
        db.rollback()
        print("Sync failed, rolled back:", e)
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(sync_matches())
