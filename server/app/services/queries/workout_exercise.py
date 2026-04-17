from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.workout_exercise import (
    WorkoutExercise,
)


async def select_next_workout_exercise_position(
    db_session: AsyncSession,
    workout_id: int,
) -> int:
    result = await db_session.execute(
        select(
            func.coalesce(func.max(WorkoutExercise.position), 0),
        ).where(
            WorkoutExercise.workout_id == workout_id,
        )
    )
    return int(result.scalar_one()) + 1


async def select_workout_exercises(
    db_session: AsyncSession,
    base: bool,
    order: bool,
    *where_clauses: Any,
) -> Sequence[WorkoutExercise]:
    query = select(WorkoutExercise).where(*where_clauses)
    if not base:
        query = query.options(
            selectinload(WorkoutExercise.exercise),
            selectinload(WorkoutExercise.sets),
        )
    if order:
        query = query.order_by(WorkoutExercise.position)
    result = await db_session.execute(query)
    return result.scalars().all()
