from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all import Match, Room
from app.schemas.match import MatchCreate, MatchRead

router = APIRouter(prefix="/matches", tags=["matches"])


def get_room_or_default(db: Session, room_id: int | None) -> Room:
    if room_id is not None:
        room = db.get(Room, room_id)
        if room is None:
            raise HTTPException(status_code=404, detail="Room not found")
        return room

    room = db.execute(select(Room).where(Room.code == "DEFAULT")).scalar_one_or_none()
    if room is None:
        room = Room(code="DEFAULT", name="Default Room")
        db.add(room)
        db.commit()
        db.refresh(room)
    return room


@router.get("", response_model=list[MatchRead])
def get_matches(
    room_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Match]:
    room = get_room_or_default(db, room_id)
    matches = (
        db.execute(
            select(Match)
            .where(Match.room_id == room.id)
            .order_by(Match.start_time.asc())
        )
        .scalars()
        .all()
    )
    return [match for match in matches if match.status != "completed"]


@router.get("/{match_id}", response_model=MatchRead)
def get_match(
    match_id: int,
    room_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> Match:
    room = get_room_or_default(db, room_id)
    match = db.execute(
        select(Match).where(Match.id == match_id, Match.room_id == room.id)
    ).scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


@router.post("", response_model=MatchRead, status_code=201)
def create_match(payload: MatchCreate, db: Session = Depends(get_db)) -> Match:
    room = get_room_or_default(db, payload.room_id)
    existing = db.execute(
        select(Match).where(
            Match.room_id == room.id, Match.external_id == payload.external_id
        )
    ).scalar_one_or_none()
    if payload.external_id and existing is not None:
        return existing

    match = Match(
        room_id=room.id,
        home_team=payload.home_team,
        away_team=payload.away_team,
        competition=payload.competition,
        venue=payload.venue,
        start_time=payload.start_time,
        status=payload.status,
        winner=payload.winner,
        external_id=payload.external_id,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match
