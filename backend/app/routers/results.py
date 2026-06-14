from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all import Match, Result
from app.routers.matches import get_room_or_default
from app.schemas.result import ResultCreate, ResultRead

router = APIRouter(prefix="/results", tags=["results"])


@router.post("", response_model=ResultRead, status_code=201)
def upsert_result(payload: ResultCreate, db: Session = Depends(get_db)) -> Result:
    room = get_room_or_default(db, payload.room_id)
    match = db.execute(
        select(Match).where(Match.id == payload.match_id, Match.room_id == room.id)
    ).scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    result = db.execute(
        select(Result).where(Result.match_id == payload.match_id, Result.room_id == room.id)
    ).scalar_one_or_none()

    if result is None:
        result = Result(
            room_id=room.id,
            match_id=payload.match_id,
            winning_team=payload.winning_team,
            processed=payload.processed,
        )
        db.add(result)
    else:
        result.winning_team = payload.winning_team
        result.processed = payload.processed

    match.status = "completed"
    match.winner = payload.winning_team
    db.commit()
    db.refresh(result)
    return result
