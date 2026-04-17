from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.workout import Workout
from app.models.database.workout_exercise import WorkoutExercise


async def select_workout_by_id(
    db_session: AsyncSession,
    workout_id: int,
) -> Workout | None:
    result = await db_session.execute(
        select(Workout).where(
            Workout.id == workout_id,
        )
    )
    return result.scalar_one_or_none()


async def select_workouts(
    db_session: AsyncSession,
    base: bool,
    *where_clauses: Any,
) -> Sequence[Workout]:
    query = select(Workout).where(*where_clauses).order_by(Workout.started_at.desc())
    if not base:
        query = query.options(
            selectinload(Workout.exercises).selectinload(WorkoutExercise.exercise),
            selectinload(Workout.exercises).selectinload(WorkoutExercise.sets),
        )
    result = await db_session.execute(query)
    return result.scalars().all()
