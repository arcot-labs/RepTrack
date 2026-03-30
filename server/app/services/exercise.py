import logging
from datetime import UTC, datetime

from meilisearch_python_sdk import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import is_unique_violation
from app.models.database.exercise import EXERCISE_UNIQUE_CONSTRAINT, Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.errors import (
    ExerciseNameConflict,
    ExerciseNotFound,
    MuscleGroupNotFound,
)
from app.models.schemas.exercise import (
    CreateExerciseRequest,
    ExercisePublic,
    UpdateExerciseRequest,
)
from app.services.muscle_group import get_muscle_groups_by_ids
from app.services.search import (
    delete_indexed_exercise,
    index_exercise,
)
from app.services.utilities.queries import query_exercises
from app.services.utilities.serializers import to_exercise_public

logger = logging.getLogger(__name__)


async def _get_owned_exercise(
    exercise_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> Exercise:
    result = await db_session.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise or user_id != exercise.user_id:
        raise ExerciseNotFound()
    return exercise


async def _index_exercise(
    exercise: Exercise,
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> int:
    logger.info("Indexing exercise %s", exercise.id)

    exercises = await query_exercises(
        db_session,
        False,
        Exercise.id == exercise.id,
    )
    if not exercises:
        raise ExerciseNotFound()

    return await index_exercise(exercises[0], ms_client)


async def create_exercise(
    user_id: int,
    req: CreateExerciseRequest,
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> None:
    logger.info(f"Creating exercise '{req.name}' for user {user_id}")

    muscle_groups = await get_muscle_groups_by_ids(req.muscle_group_ids, db_session)
    if len(muscle_groups) != len(req.muscle_group_ids):
        raise MuscleGroupNotFound()

    exercise = Exercise(
        user_id=user_id,
        name=req.name,
        description=req.description,
    )
    db_session.add(exercise)

    try:
        await db_session.flush()
    except IntegrityError as e:
        logger.error(f"Integrity error creating exercise: {e}")
        await db_session.rollback()
        if is_unique_violation(e, EXERCISE_UNIQUE_CONSTRAINT):
            raise ExerciseNameConflict()
        raise

    for mg in muscle_groups:
        db_session.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=mg.id,
            )
        )

    await db_session.commit()
    await db_session.refresh(exercise)
    await _index_exercise(exercise, db_session, ms_client)


async def get_exercises(
    user_id: int,
    db_session: AsyncSession,
) -> list[ExercisePublic]:
    logger.info(f"Getting exercises for user {user_id}")

    exercises = await query_exercises(
        db_session,
        False,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    return [to_exercise_public(e) for e in exercises]


async def get_exercise(
    exercise_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> ExercisePublic:
    logger.info(f"Getting exercise {exercise_id} for user {user_id}")

    exercises = await query_exercises(
        db_session,
        False,
        Exercise.id == exercise_id,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    if not exercises:
        raise ExerciseNotFound()
    return to_exercise_public(exercises[0])


async def update_exercise(
    exercise_id: int,
    user_id: int,
    req: UpdateExerciseRequest,
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> None:
    logger.info(f"Updating exercise {exercise_id} for user {user_id}")

    exercise = await _get_owned_exercise(exercise_id, user_id, db_session)

    if not req.model_fields_set:
        logger.info("No changes provided, skipping update")
        return

    if "name" in req.model_fields_set:
        assert req.name is not None
        exercise.name = req.name

    if "description" in req.model_fields_set:
        exercise.description = req.description

    if "muscle_group_ids" in req.model_fields_set:
        assert req.muscle_group_ids is not None
        muscle_groups = await get_muscle_groups_by_ids(req.muscle_group_ids, db_session)
        if len(muscle_groups) != len(req.muscle_group_ids):
            raise MuscleGroupNotFound()

        await db_session.execute(
            delete(ExerciseMuscleGroup).where(
                ExerciseMuscleGroup.exercise_id == exercise_id
            ),
        )
        for mg in muscle_groups:
            db_session.add(
                ExerciseMuscleGroup(exercise_id=exercise_id, muscle_group_id=mg.id),
            )
        # manually update in case of only muscle group changes
        exercise.updated_at = datetime.now(UTC)

    try:
        await db_session.commit()
        await db_session.refresh(exercise)
    except IntegrityError as e:
        logger.error(f"Integrity error updating exercise: {e}")
        await db_session.rollback()
        if is_unique_violation(e, EXERCISE_UNIQUE_CONSTRAINT):
            raise ExerciseNameConflict()
        raise
    else:
        await _index_exercise(exercise, db_session, ms_client)


async def delete_exercise(
    exercise_id: int,
    user_id: int,
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> None:
    logger.info(f"Deleting exercise {exercise_id} for user {user_id}")

    exercise = await _get_owned_exercise(exercise_id, user_id, db_session)
    await db_session.delete(exercise)
    await db_session.commit()
    await delete_indexed_exercise(exercise, ms_client)
