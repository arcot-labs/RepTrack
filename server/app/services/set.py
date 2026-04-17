import logging

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
from app.models.schemas.set import CreateSetRequest, UpdateSetRequest
from app.services.queries.set import select_next_set_number, select_sets
from app.services.queries.workout_exercise import select_workout_exercises
from app.services.workout import get_owned_workout

logger = logging.getLogger(__name__)


async def create_set(
    workout_id: int,
    workout_exercise_id: int,
    user_id: int,
    req: CreateSetRequest,
    db_session: AsyncSession,
) -> None:
    logger.info(
        f"Creating set for workout exercise {workout_exercise_id} in workout {workout_id}"
    )

    # validate workout existence & ownership
    await get_owned_workout(workout_id, user_id, db_session)

    result = await select_workout_exercises(
        db_session,
        False,
        True,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    workout_exercise = result[0] if result else None
    if not workout_exercise:
        raise WorkoutExerciseNotFound()

    set_number = await select_next_set_number(db_session, workout_exercise_id)
    set_ = Set(
        workout_exercise_id=workout_exercise_id,
        set_number=set_number,
        reps=req.reps,
        weight=req.weight,
        unit=req.unit,
        notes=req.notes,
    )
    db_session.add(set_)

    try:
        await db_session.commit()
    except IntegrityError as e:
        logger.error(f"Integrity error creating set: {e}")
        await db_session.rollback()
        if is_unique_violation(e, SET_UNIQUE_CONSTRAINT):
            raise SetNumberConflict()
        raise


async def update_set(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    user_id: int,
    req: UpdateSetRequest,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Updating set {set_id} for workout exercise {workout_exercise_id}")

    await get_owned_workout(workout_id, user_id, db_session)

    result = await select_sets(
        db_session,
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

    await db_session.commit()


async def delete_set(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Deleting set {set_id} from workout {workout_id}")

    await get_owned_workout(workout_id, user_id, db_session)

    result = await select_sets(
        db_session,
        Set.id == set_id,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    set_ = result[0] if result else None
    if not set_:
        raise SetNotFound()

    await db_session.delete(set_)
    await db_session.commit()
