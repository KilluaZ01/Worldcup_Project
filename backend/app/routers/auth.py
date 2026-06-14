from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.settings import get_settings
from app.models.all import User, Room, Participant
from app.schemas.common import (
    UserCreate,
    UserRead,
    TokenResponse,
    RoomRead,
    JoinPayload,
)

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    # bcrypt limits passwords to 72 bytes. Validate to avoid ValueError in passlib.
    if len(payload.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password too long; must be at most 72 bytes")
    pw_hash = pwd_context.hash(payload.password)
    user = User(email=payload.email, password_hash=pw_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserCreate, db: Session = Depends(get_db)):
    # protect against too-long passwords causing bcrypt error
    if len(payload.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password too long; must be at most 72 bytes")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    exp = datetime.utcnow() + timedelta(seconds=settings.jwt_exp_seconds)
    token = jwt.encode(
        {"sub": str(user.id), "exp": exp, "email": user.email},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return {"access_token": token, "token_type": "bearer"}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).get(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)):
    """Return user if Authorization header present and valid, else None"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        user_id = int(payload.get("sub"))
    except JWTError:
        return None
    user = db.query(User).get(user_id)
    return user


@router.get("/me", response_model=UserRead)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/me/rooms")
def my_rooms(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    parts = db.query(Participant).filter(Participant.user_id == user.id).all()
    rooms = []
    for p in parts:
        r = db.query(Room).get(p.room_id)
        if r:
            rooms.append(r)
    return rooms


@router.post("/me/rooms/join", response_model=RoomRead)
def join_room_for_user(
    payload: "JoinPayload",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # join a room as the authenticated user
    room = db.query(Room).filter(Room.code == payload.code).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    # check existing participant for this user
    existing = (
        db.query(Participant)
        .filter(Participant.room_id == room.id, Participant.user_id == user.id)
        .first()
    )

    # if room locked and user not already participant -> reject
    if room.locked and existing is None:
        raise HTTPException(status_code=403, detail="Room is locked")

    if existing is not None and existing.active:
        # already active
        participants = (
            db.query(Participant).filter(Participant.room_id == room.id).all()
        )
        room.participants = participants
        return room

    # if existing but inactive, reactivate and increment occupants
    if existing is not None and not existing.active:
        existing.active = True
        room.occupants = (room.occupants or 0) + 1
        if room.occupants >= (room.capacity or 2):
            room.locked = True
        db.add(existing)
        db.add(room)
        db.commit()
        db.refresh(room)
        participants = (
            db.query(Participant).filter(Participant.room_id == room.id).all()
        )
        room.participants = participants
        return room

    # no existing participant -> enforce capacity
    if (room.occupants or 0) >= (room.capacity or 2):
        room.locked = True
        db.add(room)
        db.commit()
        db.refresh(room)
        raise HTTPException(status_code=403, detail="Room is full")

    # create participant and increment
    room.occupants = (room.occupants or 0) + 1
    if room.occupants >= (room.capacity or 2):
        room.locked = True

    display_name = payload.name if getattr(payload, "name", None) else user.email
    participant = Participant(
        room_id=room.id, user_id=user.id, name=display_name, active=True
    )
    db.add(participant)
    db.add(room)
    db.commit()
    db.refresh(room)
    participants = db.query(Participant).filter(Participant.room_id == room.id).all()
    room.participants = participants
    return room


@router.post("/me/rooms/leave", response_model=RoomRead)
def leave_room_for_user(
    payload: "JoinPayload",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter(Room.code == payload.code).first()
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found")

    participant = (
        db.query(Participant)
        .filter(
            Participant.room_id == room.id,
            Participant.user_id == user.id,
            Participant.active == True,
        )
        .first()
    )
    if participant is None:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.active = False
    room.occupants = max(0, (room.occupants or 0) - 1)
    if room.occupants == 0:
        room.locked = False

    db.add(participant)
    db.add(room)
    db.commit()
    db.refresh(room)
    participants = db.query(Participant).filter(Participant.room_id == room.id).all()
    room.participants = participants
    return room
