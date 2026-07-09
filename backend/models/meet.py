from datetime import date, datetime, timezone
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base

if TYPE_CHECKING:
    from models.user import User

class Meet(Base):
    __tablename__ = "meets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    topic: Mapped[str] = mapped_column(nullable=False)
    date: Mapped[date] = mapped_column(Date(), nullable=False)
    createdBy: Mapped[int] = mapped_column(nullable=False)

    createdAt: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, server_default=func.now()
    )

    meet_users: Mapped[list["MeetUser"]] = relationship(
        "MeetUser",
        back_populates="meet",
        cascade="all, delete-orphan"
    )


class MeetUser(Base):
    __tablename__ = "meet_users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    meet_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("meets.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    date: Mapped[date] = mapped_column(Date(), nullable=False)

    meet: Mapped[Meet] = relationship(
        "Meet",
        foreign_keys=[meet_id],
        back_populates="meet_users"
    )
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="user_meets"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_per_day"),
    )
