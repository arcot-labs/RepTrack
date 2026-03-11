from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import TEXT, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.database.exercise_muscle_group import ExerciseMuscleGroup


class Exercise(Base):
    __tablename__ = "exercises"
    __table_args__ = (
        Index("ix_exercises_user_id", "user_id"),
        UniqueConstraint("user_id", "name", name="uq_exercises_user_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    # null for system exercise
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(TEXT)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    muscle_groups: Mapped[list[ExerciseMuscleGroup]] = relationship(
        "ExerciseMuscleGroup",
    )
