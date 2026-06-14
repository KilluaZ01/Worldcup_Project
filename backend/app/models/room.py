from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    capacity: Mapped[int] = mapped_column("capacity", nullable=False, default=2)
    occupants: Mapped[int] = mapped_column("occupants", nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    matches = relationship("Match", back_populates="room", cascade="all, delete-orphan")
