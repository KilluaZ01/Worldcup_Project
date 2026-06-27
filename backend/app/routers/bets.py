from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rooms import get_room_or_default
from app.models.all import Bet, Match, Participant, Room, User
from app.routers.auth import get_current_user
from app.schemas.bet import (
    BetRead,
    BetHistoryItem,
    PlaceBetRequest,
    PlaceBetResponse,
    UpdateBetAmountsRequest,
)
from app.services.leaderboard import bet_wins

router = APIRouter(prefix="/bets", tags=["bets"])


def _get_active_pair(db: Session, room_id: int, user_id: int):
    """Shared helper: resolve room, validate 2 active participants, return (me, opponent)."""
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

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

    me = next((p for p in active_participants if p.user_id == user_id), None)
    if me is None:
        raise HTTPException(
            status_code=403, detail="You are not an active participant in this room"
        )

    opponent = next((p for p in active_participants if p.user_id != user_id), None)
    if opponent is None:
        raise HTTPException(status_code=400, detail="No opponent found in this room")

    return room, me, opponent


@router.post("", response_model=PlaceBetResponse, status_code=201)
def place_bet(
    payload: PlaceBetRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlaceBetResponse:
    room, me, opponent = _get_active_pair(db, payload.room_id, user.id)

    match = db.get(Match, payload.match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.selected_team not in (match.home_team, match.away_team):
        raise HTTPException(
            status_code=400,
            detail="selected_team must be one of the two teams in this match",
        )

    if payload.my_amount <= 0 or payload.opponent_amount <= 0:
        raise HTTPException(status_code=400, detail="Amounts must be greater than zero")

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
        amount=payload.my_amount,
        is_initiator=True,
    )
    opponent_bet = Bet(
        room_id=room.id,
        match_id=match.id,
        bettor=opponent.name,
        selected_team=opposing_team,
        amount=payload.opponent_amount,
        is_initiator=False,
    )

    db.add(your_bet)
    db.add(opponent_bet)
    db.commit()
    db.refresh(your_bet)
    db.refresh(opponent_bet)

    return PlaceBetResponse(your_bet=your_bet, opponent_bet=opponent_bet)


@router.patch("/{match_id}", response_model=PlaceBetResponse)
def update_bet_amounts(
    match_id: int,
    payload: UpdateBetAmountsRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PlaceBetResponse:
    room, me, opponent = _get_active_pair(db, payload.room_id, user.id)

    match = db.get(Match, match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    if match.start_time <= now:
        raise HTTPException(status_code=400, detail="Cannot edit a bet after kickoff")

    if payload.my_amount <= 0 or payload.opponent_amount <= 0:
        raise HTTPException(status_code=400, detail="Amounts must be greater than zero")

    bets = (
        db.execute(select(Bet).where(Bet.room_id == room.id, Bet.match_id == match_id))
        .scalars()
        .all()
    )
    if len(bets) != 2:
        raise HTTPException(
            status_code=404, detail="No bet found on this match in this room"
        )

    my_bet = next((b for b in bets if b.bettor == me.name), None)
    opponent_bet = next((b for b in bets if b.bettor == opponent.name), None)
    if my_bet is None or opponent_bet is None:
        raise HTTPException(status_code=404, detail="Bet pair is inconsistent")

    my_bet.amount = payload.my_amount
    opponent_bet.amount = payload.opponent_amount

    db.add(my_bet)
    db.add(opponent_bet)
    db.commit()
    db.refresh(my_bet)
    db.refresh(opponent_bet)

    return PlaceBetResponse(your_bet=my_bet, opponent_bet=opponent_bet)


@router.delete("/{match_id}", status_code=204)
def delete_bet(
    match_id: int,
    room_id: int = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room, me, opponent = _get_active_pair(db, room_id, user.id)

    match = db.get(Match, match_id)
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    now = datetime.now(timezone.utc)
    if match.start_time <= now:
        raise HTTPException(status_code=400, detail="Cannot delete a bet after kickoff")

    bets = (
        db.execute(select(Bet).where(Bet.room_id == room.id, Bet.match_id == match_id))
        .scalars()
        .all()
    )
    if not bets:
        raise HTTPException(
            status_code=404, detail="No bet found on this match in this room"
        )

    for bet in bets:
        db.delete(bet)
    db.commit()


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


@router.get("/history", response_model=list[BetHistoryItem])
def get_bet_history(
    room_id: int | None = Query(default=None), db: Session = Depends(get_db)
) -> list[BetHistoryItem]:
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

    result = []
    for bet in bets:
        match = bet.match
        item = BetHistoryItem.model_validate(bet)
        item.won = bet_wins(bet, match)
        result.append(item)
    return result
