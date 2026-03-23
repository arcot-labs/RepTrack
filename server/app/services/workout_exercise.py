import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import is_unique_violation
from app.models.database.exercise import Exercise
from app.models.database.workout_exercise import (
    WORKOUT_EXERCISE_UNIQUE_CONSTRAINT,
    WorkoutExercise,
)
from app.models.errors import (
    ExerciseNotFound,
    WorkoutExerciseNotFound,
    WorkoutExercisePositionConflict,
)
from app.models.schemas.workout_exercise import CreateWorkoutExerciseRequest
from app.services.utilities.queries import get_owned_workout, query_exercises

logger = logging.getLogger(__name__)


async def _get_next_workout_exercise_position(
    workout_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(
            func.coalesce(func.max(WorkoutExercise.position), 0),
        ).where(
            WorkoutExercise.workout_id == workout_id,
        )
    )
    return int(result.scalar_one()) + 1


async def create_workout_exercise(
    workout_id: int,
    user_id: int,
    req: CreateWorkoutExerciseRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Adding exercise {req.exercise_id} to workout {workout_id}")

    # validate workout existence & ownership
    await get_owned_workout(workout_id, user_id, db)

    exercises = await query_exercises(
        db,
        False,
        Exercise.id == req.exercise_id,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    exercise = exercises[0] if exercises else None
    if not exercise:
        raise ExerciseNotFound()

    position = await _get_next_workout_exercise_position(workout_id, db)
    workout_exercise = WorkoutExercise(
        workout_id=workout_id,
        exercise_id=req.exercise_id,
        position=position,
        notes=req.notes,
    )
    db.add(workout_exercise)

    try:
        await db.commit()
    except IntegrityError as e:
        logger.error(f"Integrity error creating workout exercise: {e}")
        await db.rollback()
        if is_unique_violation(e, WORKOUT_EXERCISE_UNIQUE_CONSTRAINT):
            raise WorkoutExercisePositionConflict()
        raise


async def delete_workout_exercise(
    workout_id: int,
    workout_exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Removing workout exercise {workout_exercise_id} from {workout_id}")

    await get_owned_workout(workout_id, user_id, db)

    result = await db.execute(
        select(WorkoutExercise).where(
            WorkoutExercise.id == workout_exercise_id,
            WorkoutExercise.workout_id == workout_id,
        )
    )
    workout_exercise = result.scalar_one_or_none()
    if not workout_exercise:
        raise WorkoutExerciseNotFound()

    await db.delete(workout_exercise)
    await db.commit()
