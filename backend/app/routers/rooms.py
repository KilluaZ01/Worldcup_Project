from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all import Room
from app.schemas.common import RoomCreate, RoomRead

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.post("/host", response_model=RoomRead)
def host_room(payload: RoomCreate, db: Session = Depends(get_db)) -> Room:
    existing = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Room code already exists")

    room = Room(code=payload.code, name=payload.name, capacity=2, occupants=1)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.post("/join", response_model=RoomRead)
def join_room(payload: RoomCreate, db: Session = Depends(get_db)) -> Room:
    room = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    # enforce capacity
    if room.occupants >= (room.capacity or 2):
        raise HTTPException(status_code=403, detail="Room is full")

    room.occupants = (room.occupants or 0) + 1
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.post("/leave", response_model=RoomRead)
def leave_room(payload: RoomCreate, db: Session = Depends(get_db)) -> Room:
    room = db.execute(
        select(Room).where(Room.code == payload.code)
    ).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    room.occupants = max(0, (room.occupants or 0) - 1)
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/{room_code}", response_model=RoomRead)
def get_room(room_code: str, db: Session = Depends(get_db)) -> Room:
    room = db.execute(select(Room).where(Room.code == room_code)).scalar_one_or_none()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return room
