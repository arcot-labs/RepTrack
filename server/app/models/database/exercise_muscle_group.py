from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.database.muscle_group import MuscleGroup


class ExerciseMuscleGroup(Base):
    __tablename__ = "exercise_muscle_groups"
    __table_args__ = (
        Index(
            "ix_exercise_muscle_groups_muscle_group_id",
            "muscle_group_id",
        ),
        UniqueConstraint(
            "exercise_id",
            "muscle_group_id",
            name="uq_exercise_muscle_groups_exercise_muscle_group",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )
    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False
    )
    muscle_group_id: Mapped[int] = mapped_column(
        ForeignKey("muscle_groups.id", ondelete="RESTRICT"), nullable=False
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

    muscle_group: Mapped[MuscleGroup] = relationship(
        "MuscleGroup",
    )
