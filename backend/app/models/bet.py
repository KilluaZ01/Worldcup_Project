from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bet(Base):
    __tablename__ = "bets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("rooms.id", ondelete="CASCADE"), index=True, nullable=False
    )
    is_initiator: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id", ondelete="CASCADE"), index=True, nullable=False
    )
    bettor: Mapped[str] = mapped_column(String(120), nullable=False)
    selected_team: Mapped[str] = mapped_column(String(120), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    match = relationship("Match", back_populates="bets")
