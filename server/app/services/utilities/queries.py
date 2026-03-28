from collections.abc import Sequence
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.database.set import Set
from app.models.database.workout import Workout
from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import WorkoutNotFound


async def get_owned_workout(
    workout_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> Workout:
    result = await db_session.execute(
        select(Workout).where(
            Workout.id == workout_id,
        ),
    )
    workout = result.scalar_one_or_none()
    if not workout or workout.user_id != user_id:
        raise WorkoutNotFound()
    return workout


async def query_exercises(
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


async def query_workout_exercises(
    db_session: AsyncSession,
    *where_clauses: Any,
) -> Sequence[WorkoutExercise]:
    query = (
        select(WorkoutExercise).where(*where_clauses).order_by(WorkoutExercise.position)
    )
    query = query.options(
        selectinload(WorkoutExercise.exercise),
        selectinload(WorkoutExercise.sets),
    )
    result = await db_session.execute(query)
    return result.scalars().all()


async def query_sets(
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
