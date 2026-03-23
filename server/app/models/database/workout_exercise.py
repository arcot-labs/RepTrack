from datetime import datetime
from typing import TYPE_CHECKING

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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.database.exercise import Exercise
    from app.models.database.set import Set
    from app.models.database.workout import Workout

WORKOUT_EXERCISE_UNIQUE_CONSTRAINT = "uq_workout_exercises_workout_position"


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (
        Index(
            "ix_workout_exercises_workout_id",
            "workout_id",
        ),
        Index(
            "ix_workout_exercises_exercise_id",
            "exercise_id",
        ),
        UniqueConstraint(
            "workout_id",
            "position",
            name=WORKOUT_EXERCISE_UNIQUE_CONSTRAINT,
        ),
        CheckConstraint(
            "position > 0",
            name="ck_workout_exercises_position_positive",
        ),
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

    workout: Mapped[Workout] = relationship(
        "Workout",
        back_populates="exercises",
    )
    exercise: Mapped[Exercise] = relationship(
        "Exercise",
    )
    sets: Mapped[list[Set]] = relationship(
        "Set",
        back_populates="workout_exercise",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Set.set_number",
    )
