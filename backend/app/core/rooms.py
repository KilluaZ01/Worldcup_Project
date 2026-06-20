from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.all import Room


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
