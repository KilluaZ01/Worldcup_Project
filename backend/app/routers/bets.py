from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rooms import get_room_or_default
from app.models.all import Bet, Match
from app.schemas.bet import BetCreate, BetRead

router = APIRouter(prefix="/bets", tags=["bets"])


@router.post("", response_model=BetRead, status_code=201)
def place_bet(payload: BetCreate, db: Session = Depends(get_db)) -> Bet:
    room = get_room_or_default(db, payload.room_id)

    match = db.get(Match, payload.match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    bet = Bet(
        room_id=room.id,
        match_id=payload.match_id,
        bettor=payload.bettor,
        selected_team=payload.selected_team,
        amount=payload.amount,
    )
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet


@router.get("", response_model=list[BetRead])
def get_bets(
    room_id: int | None = Query(default=None), db: Session = Depends(get_db)
) -> list[Bet]:
    room = get_room_or_default(db, room_id)
    bets = (
        db.execute(
            select(Bet).where(Bet.room_id == room.id).order_by(Bet.created_at.desc())
        )
        .scalars()
        .all()
    )
    return bets


@router.get("/history", response_model=list[BetRead])
def get_bet_history(
    room_id: int | None = Query(default=None), db: Session = Depends(get_db)
) -> list[Bet]:
    room = get_room_or_default(db, room_id)
    bets = (
        db.execute(
            select(Bet)
            .join(Match, Bet.match_id == Match.id)
            .where(Bet.room_id == room.id, Match.status == "finished")
            .order_by(Bet.created_at.desc())
        )
        .scalars()
        .all()
    )
    return bets
