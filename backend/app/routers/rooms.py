from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all import Room, Participant, User
from app.schemas.common import (
    HostPayload,
    JoinPayload,
    RoomRead,
    ParticipantRead,
    RoomNameUpdate,
)
from app.routers.auth import get_optional_user, get_current_user

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/host", response_model=RoomRead)
def host_room(
    payload: HostPayload,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Room:
    existing = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Room code already exists")

    display_name = (
        payload.host_name
        if payload.host_name
        else (user.display_name if user else "Host")
    )

    room = Room(
        code=payload.code,
        name=f"{display_name}'s Room",
        capacity=2,
        occupants=1,
        locked=False,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    participant = Participant(
        room_id=room.id,
        name=display_name,
        active=True,
        user_id=(user.id if user else None),
    )
    db.add(participant)
    db.commit()

    room.participants = [participant]
    return room


@router.post("/join", response_model=RoomRead)
def join_room(
    payload: JoinPayload,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Room:
    room = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    # if room is locked, do not allow joining until it's empty unless user already participant
    if getattr(room, "locked", False):
        # allow rejoin for existing user participant
        if user is None:
            raise HTTPException(status_code=403, detail="Room is locked")
        existing_part = db.execute(
            select(Participant).where(
                Participant.room_id == room.id, Participant.user_id == user.id
            )
        ).scalar_one_or_none()
        if existing_part is None:
            raise HTTPException(status_code=403, detail="Room is locked")

    # enforce capacity
    if (room.occupants or 0) >= (room.capacity or 2):
        # if user already a participant, allow (don't increment)
        if user is not None:
            existing_part = db.execute(
                select(Participant).where(
                    Participant.room_id == room.id, Participant.user_id == user.id
                )
            ).scalar_one_or_none()
            if existing_part is None:
                room.locked = True
                db.add(room)
                db.commit()
                db.refresh(room)
                raise HTTPException(status_code=403, detail="Room is full")
        else:
            room.locked = True
            db.add(room)
            db.commit()
            db.refresh(room)
            raise HTTPException(status_code=403, detail="Room is full")

    # increment occupants if user is not already a participant
    if user is not None:
        existing_part = db.execute(
            select(Participant).where(
                Participant.room_id == room.id, Participant.user_id == user.id
            )
        ).scalar_one_or_none()
        if existing_part is None:
            room.occupants = (room.occupants or 0) + 1
    else:
        room.occupants = (room.occupants or 0) + 1

    if room.occupants >= (room.capacity or 2):
        room.locked = True

    db.add(room)
    db.commit()
    db.refresh(room)

    # create participant if not existing
    if user is not None:
        participant = db.execute(
            select(Participant).where(
                Participant.room_id == room.id, Participant.user_id == user.id
            )
        ).scalar_one_or_none()
        if participant is None:
            display_name = payload.name if payload.name else user.display_name
            participant = Participant(
                room_id=room.id, name=display_name, active=True, user_id=user.id
            )
            db.add(participant)
            db.commit()
    else:
        participant = Participant(room_id=room.id, name=payload.name, active=True)
        db.add(participant)
        db.commit()

    # include participants in response
    participants = (
        db.execute(select(Participant).where(Participant.room_id == room.id))
        .scalars()
        .all()
    )
    room.participants = participants
    return room


@router.post("/leave", response_model=RoomRead)
def leave_room(
    payload: JoinPayload,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Room:
    room = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    # try to mark participant inactive (prefer matching user_id, fallback to name)
    participant = None
    if user is not None:
        participant = db.execute(
            select(Participant).where(
                Participant.room_id == room.id,
                Participant.user_id == user.id,
                Participant.active == True,
            )
        ).scalar_one_or_none()
    if participant is None:
        participant = db.execute(
            select(Participant).where(
                Participant.room_id == room.id,
                Participant.name == payload.name,
                Participant.active == True,
            )
        ).scalar_one_or_none()

    if participant is not None:
        participant.active = False
        db.add(participant)

        # decrement occupants only if participant was active
        room.occupants = max(0, (room.occupants or 0) - 1)
        if room.occupants == 0:
            room.locked = False

    db.add(room)
    db.commit()
    db.refresh(room)

    participants = (
        db.execute(select(Participant).where(Participant.room_id == room.id))
        .scalars()
        .all()
    )
    room.participants = participants
    return room


@router.get("/{room_code}", response_model=RoomRead)
def get_room(room_code: str, db: Session = Depends(get_db)) -> Room:
    room = db.execute(select(Room).where(Room.code == room_code)).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.delete("/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    earliest = (
        db.query(Participant)
        .filter(Participant.room_id == room.id)
        .order_by(Participant.joined_at.asc())
        .first()
    )
    if earliest is None or earliest.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="Only the host can delete this room"
        )

    db.delete(room)
    db.commit()


@router.patch("/{room_id}", response_model=RoomRead)
def rename_room(
    room_id: int,
    payload: RoomNameUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Room:
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    is_participant = db.execute(
        select(Participant).where(
            Participant.room_id == room.id,
            Participant.user_id == user.id,
            Participant.active == True,
        )
    ).scalar_one_or_none()
    if is_participant is None:
        raise HTTPException(
            status_code=403, detail="You are not an active participant in this room"
        )

    new_name = payload.name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Room name cannot be empty")
    if len(new_name) > 100:
        raise HTTPException(status_code=400, detail="Room name too long")

    room.name = new_name
    db.add(room)
    db.commit()
    db.refresh(room)

    participants = (
        db.execute(select(Participant).where(Participant.room_id == room.id))
        .scalars()
        .all()
    )
    room.participants = participants
    return room
