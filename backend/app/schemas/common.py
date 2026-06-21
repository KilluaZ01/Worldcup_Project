from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RoomBase(BaseModel):
    code: str


class RoomCreate(RoomBase):
    pass


class HostPayload(BaseModel):
    code: str
    host_name: str


class JoinPayload(BaseModel):
    code: str
    name: str


class ParticipantRead(ORMModel):
    id: int
    user_id: int | None = None
    name: str
    active: bool
    joined_at: datetime


# auth schemas
class UserCreate(BaseModel):
    email: str
    password: str


class UserRead(ORMModel):
    id: int
    email: str
    display_name: str | None = None
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoomRead(ORMModel, RoomBase):
    id: int
    capacity: int = 2
    occupants: int = 0
    locked: bool = False
    participants: list[ParticipantRead] | None = None
    created_at: datetime
