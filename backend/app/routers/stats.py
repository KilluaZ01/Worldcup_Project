from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routers.matches import get_room_or_default
from app.services.stats import calculate_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("")
def get_stats(room_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    room = get_room_or_default(db, room_id)
    return calculate_stats(db, room.id)
