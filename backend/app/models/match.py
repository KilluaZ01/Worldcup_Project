from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id", ondelete="CASCADE"), index=True, nullable=False)
    home_team: Mapped[str] = mapped_column(String(120), nullable=False)
    away_team: Mapped[str] = mapped_column(String(120), nullable=False)
    competition: Mapped[str] = mapped_column(String(120), nullable=False)
    venue: Mapped[str] = mapped_column(String(180), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="scheduled", nullable=False)
    winner: Mapped[str | None] = mapped_column(String(120), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    room = relationship("Room", back_populates="matches")
    bets = relationship("Bet", back_populates="match", cascade="all, delete-orphan")
    result = relationship("Result", back_populates="match", uselist=False, cascade="all, delete-orphan")
