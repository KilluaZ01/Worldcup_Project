from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_db
from app.models.all import Match
from app.schemas.match import MatchRead
from app.services.standings import calculate_standings

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchRead])
def get_matches(db: Session = Depends(get_db)) -> list[Match]:
    matches = db.execute(select(Match).order_by(Match.start_time.asc())).scalars().all()
    return matches


@router.get("/standings")
def get_standings(db: Session = Depends(get_db)) -> dict[str, list[dict]]:
    return calculate_standings(db)


@router.get("/{match_id}", response_model=MatchRead)
def get_match(match_id: int, db: Session = Depends(get_db)) -> Match:
    match = db.get(Match, match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
