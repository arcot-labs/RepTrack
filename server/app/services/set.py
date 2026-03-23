import logging
from collections.abc import Sequence
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import is_unique_violation
from app.models.database.set import SET_UNIQUE_CONSTRAINT, Set
from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import (
    SetNotFound,
    SetNumberConflict,
    WorkoutExerciseNotFound,
)
from app.models.schemas.set import CreateSetRequest, SetPublic, UpdateSetRequest
from app.services.workout import get_owned_workout

logger = logging.getLogger(__name__)


def to_set_public(set_: Set) -> SetPublic:
    return SetPublic.model_validate(set_, from_attributes=True)


async def query_sets(
    db: AsyncSession,
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
    result = await db.execute(query)
    return result.scalars().all()


async def _get_next_set_number(
    workout_exercise_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(
            func.coalesce(func.max(Set.set_number), 0),
        ).where(
            Set.workout_exercise_id == workout_exercise_id,
        )
    )
    return int(result.scalar_one()) + 1


async def create_set(
    workout_id: int,
    workout_exercise_id: int,
    user_id: int,
    req: CreateSetRequest,
    db: AsyncSession,
) -> None:
    logger.info(
        f"Creating set for workout exercise {workout_exercise_id} in workout {workout_id}"
    )

    # validate workout existence & ownership
    await get_owned_workout(workout_id, user_id, db)

    from app.services.workout_exercise import query_workout_exercises

    result = await query_workout_exercises(
        db,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    workout_exercise = result[0] if result else None
    if not workout_exercise:
        raise WorkoutExerciseNotFound()

    set_number = await _get_next_set_number(workout_exercise_id, db)
    set_ = Set(
        workout_exercise_id=workout_exercise_id,
        set_number=set_number,
        reps=req.reps,
        weight=req.weight,
        unit=req.unit,
        notes=req.notes,
    )
    db.add(set_)

    try:
        await db.commit()
    except IntegrityError as e:
        logger.error(f"Integrity error creating set: {e}")
        await db.rollback()
        if is_unique_violation(e, SET_UNIQUE_CONSTRAINT):
            raise SetNumberConflict()
        raise


async def update_set(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    user_id: int,
    req: UpdateSetRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Updating set {set_id} for workout exercise {workout_exercise_id}")

    await get_owned_workout(workout_id, user_id, db)

    result = await query_sets(
        db,
        Set.id == set_id,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    set_ = result[0] if result else None
    if not set_:
        raise SetNotFound()

    if not req.model_fields_set:
        logger.info("No changes provided, skipping update")
        return

    if "reps" in req.model_fields_set:
        set_.reps = req.reps
    if "weight" in req.model_fields_set:
        set_.weight = req.weight
    if "unit" in req.model_fields_set:
        set_.unit = req.unit
    if "notes" in req.model_fields_set:
        set_.notes = req.notes

    await db.commit()


async def delete_set(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Deleting set {set_id} from workout {workout_id}")

    await get_owned_workout(workout_id, user_id, db)

    result = await query_sets(
        db,
        Set.id == set_id,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    set_ = result[0] if result else None
    if not set_:
        raise SetNotFound()

    await db.delete(set_)
    await db.commit()
