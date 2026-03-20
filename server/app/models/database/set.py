from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    TEXT,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.database.workout_exercise import WorkoutExercise


class Set(Base):
    __tablename__ = "sets"
    __table_args__ = (
        Index("ix_sets_workout_exercise_id", "workout_exercise_id"),
        UniqueConstraint(
            "workout_exercise_id",
            "set_number",
            name="uq_sets_workout_exercise_set_number",
        ),
        CheckConstraint("set_number > 0", name="ck_sets_set_number_positive"),
        CheckConstraint("reps IS NULL OR reps >= 0", name="ck_sets_reps_non_negative"),
        CheckConstraint(
            "unit IS NULL OR unit IN ('kg', 'lb')",
            name="ck_sets_unit_valid",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    workout_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("workout_exercises.id", ondelete="CASCADE"),
        nullable=False,
    )
    set_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    reps: Mapped[int | None] = mapped_column(
        Integer,
    )
    weight: Mapped[float | None] = mapped_column(
        Numeric(6, 2),
    )
    unit: Mapped[str | None] = mapped_column(
        String(255),
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

    workout_exercise: Mapped[WorkoutExercise] = relationship(
        "WorkoutExercise",
        back_populates="sets",
    )
