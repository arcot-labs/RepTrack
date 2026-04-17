from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.models.database.workout_exercise import WorkoutExercise


async def select_next_set_number(
    db_session: AsyncSession,
    workout_exercise_id: int,
) -> int:
    result = await db_session.execute(
        select(
            func.coalesce(func.max(Set.set_number), 0),
        ).where(
            Set.workout_exercise_id == workout_exercise_id,
        )
    )
    return int(result.scalar_one()) + 1


async def select_sets(
    db_session: AsyncSession,
    *where_clauses: Any,
) -> Sequence[Set]:
    query = (
        select(Set)
        .join(
            WorkoutExercise,
            Set.workout_exercise_id == WorkoutExercise.id,
        )
        .where(*where_clauses)
        .order_by(Set.set_number)
    )
    result = await db_session.execute(query)
    return result.scalars().all()
