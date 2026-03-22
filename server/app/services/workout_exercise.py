import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import (
    ExerciseNotFound,
    WorkoutExerciseNotFound,
)
from app.models.schemas.workout_exercise import (
    CreateWorkoutExerciseRequest,
    WorkoutExercisePublic,
)
from app.services.exercise import query_exercises, to_exercise_base
from app.services.set import to_set_public
from app.services.workout import get_owned_workout

logger = logging.getLogger(__name__)


def to_workout_exercise_public(
    workout_exercise: WorkoutExercise,
) -> WorkoutExercisePublic:
    return WorkoutExercisePublic(
        id=workout_exercise.id,
        workout_id=workout_exercise.workout_id,
        exercise_id=workout_exercise.exercise_id,
        position=workout_exercise.position,
        notes=workout_exercise.notes,
        created_at=workout_exercise.created_at,
        updated_at=workout_exercise.updated_at,
        exercise=to_exercise_base(workout_exercise.exercise),
        sets=[to_set_public(s) for s in workout_exercise.sets],
    )


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
    await db.commit()


async def delete_workout_exercise(
    workout_id: int,
    workout_exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Removing workout exercise {workout_exercise_id} from {workout_id}")

    # validate workout existence & ownership
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
