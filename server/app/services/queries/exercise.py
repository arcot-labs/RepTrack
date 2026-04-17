from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup


async def select_exercise_by_id(
    db_session: AsyncSession,
    exercise_id: int,
) -> Exercise | None:
    result = await db_session.execute(
        select(Exercise).where(Exercise.id == exercise_id)
    )
    return result.scalar_one_or_none()


async def select_exercises(
    db_session: AsyncSession,
    base: bool,
    *where_clauses: Any,
) -> Sequence[Exercise]:
    query = select(Exercise).where(*where_clauses)
    # display custom exercises first
    query = query.order_by(Exercise.user_id, Exercise.name)
    if not base:
        query = query.options(
            selectinload(Exercise.muscle_groups).selectinload(
                ExerciseMuscleGroup.muscle_group
            )
        )
    result = await db_session.execute(query)
    return result.scalars().all()
