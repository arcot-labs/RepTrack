import logging

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
from app.services.queries.exercise import select_exercises
from app.services.queries.workout_exercise import (
    select_next_workout_exercise_position,
    select_workout_exercises,
)
from app.services.workout import get_owned_workout

logger = logging.getLogger(__name__)


async def create_workout_exercise(
    workout_id: int,
    user_id: int,
    req: CreateWorkoutExerciseRequest,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Adding exercise {req.exercise_id} to workout {workout_id}")

    # validate workout existence & ownership
    await get_owned_workout(workout_id, user_id, db_session)

    exercises = await select_exercises(
        db_session,
        False,
        Exercise.id == req.exercise_id,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    exercise = exercises[0] if exercises else None
    if not exercise:
        raise ExerciseNotFound()

    position = await select_next_workout_exercise_position(db_session, workout_id)
    workout_exercise = WorkoutExercise(
        workout_id=workout_id,
        exercise_id=req.exercise_id,
        position=position,
        notes=req.notes,
    )
    db_session.add(workout_exercise)

    try:
        await db_session.commit()
    except IntegrityError as e:
        logger.error(f"Integrity error creating workout exercise: {e}")
        await db_session.rollback()
        if is_unique_violation(e, WORKOUT_EXERCISE_UNIQUE_CONSTRAINT):
            raise WorkoutExercisePositionConflict()
        raise


async def delete_workout_exercise(
    workout_id: int,
    workout_exercise_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Removing workout exercise {workout_exercise_id} from {workout_id}")

    await get_owned_workout(workout_id, user_id, db_session)

    result = await select_workout_exercises(
        db_session,
        True,
        False,
        WorkoutExercise.id == workout_exercise_id,
        WorkoutExercise.workout_id == workout_id,
    )
    workout_exercise = result[0] if result else None
    if not workout_exercise:
        raise WorkoutExerciseNotFound()

    await db_session.delete(workout_exercise)
    await db_session.commit()
