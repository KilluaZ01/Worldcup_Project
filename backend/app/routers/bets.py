from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rooms import get_room_or_default
from app.models.all import Bet, Match, Participant, Room, User
from app.routers.auth import get_current_user
from app.schemas.bet import BetRead, PlaceBetRequest, PlaceBetResponse

router = APIRouter(prefix="/bets", tags=["bets"])


@router.post("", response_model=PlaceBetResponse, status_code=201)
def place_bet(
    payload: PlaceBetRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlaceBetResponse:
    room = db.get(Room, payload.room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    match = db.get(Match, payload.match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.selected_team not in (match.home_team, match.away_team):
        raise HTTPException(
            status_code=400,
            detail="selected_team must be one of the two teams in this match",
        )

    active_participants = (
        db.execute(
            select(Participant).where(
                Participant.room_id == room.id, Participant.active == True
            )
        )
        .scalars()
        .all()
    )

    if len(active_participants) < 2:
        raise HTTPException(
            status_code=400, detail="Waiting for a second participant to join this room"
        )

    me = next((p for p in active_participants if p.user_id == user.id), None)
    if me is None:
        raise HTTPException(
            status_code=403, detail="You are not an active participant in this room"
        )

    opponent = next((p for p in active_participants if p.user_id != user.id), None)
    if opponent is None:
        raise HTTPException(status_code=400, detail="No opponent found in this room")

    existing_bet = db.execute(
        select(Bet).where(Bet.room_id == room.id, Bet.match_id == match.id)
    ).scalar_one_or_none()
    if existing_bet is not None:
        raise HTTPException(
            status_code=409,
            detail="A bet has already been placed on this match in this room",
        )

    opposing_team = (
        match.away_team if payload.selected_team == match.home_team else match.home_team
    )

    your_bet = Bet(
        room_id=room.id,
        match_id=match.id,
        bettor=me.name,
        selected_team=payload.selected_team,
        amount=payload.amount,
        is_initiator=True,
    )
    opponent_bet = Bet(
        room_id=room.id,
        match_id=match.id,
        bettor=opponent.name,
        selected_team=opposing_team,
        amount=payload.amount,
        is_initiator=False,
    )

    db.add(your_bet)
    db.add(opponent_bet)
    db.commit()
    db.refresh(your_bet)
    db.refresh(opponent_bet)

    return PlaceBetResponse(your_bet=your_bet, opponent_bet=opponent_bet)


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
