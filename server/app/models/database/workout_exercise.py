from datetime import datetime

from sqlalchemy import (
    TEXT,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        Index("ix_workout_exercises_workout_id", "workout_id"),
        Index("ix_workout_exercises_exercise_id", "exercise_id"),
        UniqueConstraint(
            "workout_id", "position", name="uq_workout_exercises_workout_position"
        ),
        CheckConstraint("position > 0", name="ck_workout_exercises_position_positive"),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    workout_id: Mapped[int] = mapped_column(
        ForeignKey("workouts.id", ondelete="CASCADE"),
        nullable=False,
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="RESTRICT"),
        nullable=False,
    )
    position: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(
        TEXT,
    )
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
