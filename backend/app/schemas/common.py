from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RoomBase(BaseModel):
    code: str
    name: str | None = None


class RoomCreate(RoomBase):
    pass


class RoomRead(ORMModel, RoomBase):
    id: int
    capacity: int = 2
    occupants: int = 0
    created_at: datetime
