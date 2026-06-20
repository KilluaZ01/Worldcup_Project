from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rooms import get_room_or_default
from app.services.leaderboard import calculate_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("")
def get_leaderboard(
    room_id: int | None = Query(default=None), db: Session = Depends(get_db)
):
    room = get_room_or_default(db, room_id)
    return calculate_leaderboard(db, room.id)
