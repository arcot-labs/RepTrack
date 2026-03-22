import logging
from collections.abc import Sequence
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.errors import (
    ExerciseNameConflict,
    ExerciseNotFound,
    MuscleGroupNotFound,
)
from app.models.schemas.exercise import (
    CreateExerciseRequest,
    ExerciseBase,
    ExercisePublic,
    UpdateExerciseRequest,
)
from app.services.muscle_group import get_muscle_groups_by_ids, to_muscle_group_public

logger = logging.getLogger(__name__)


async def query_exercises(
    db: AsyncSession,
    base: bool,
    *where_clauses: Any,
) -> Sequence[Exercise]:
    query = select(Exercise).where(*where_clauses).order_by(Exercise.name)
    if not base:
        query = query.options(
            selectinload(Exercise.muscle_groups).selectinload(
                ExerciseMuscleGroup.muscle_group
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


async def _get_owned_exercise(
    exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> Exercise:
    result = await db.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise or user_id != exercise.user_id:
        raise ExerciseNotFound()
    return exercise


def to_exercise_base(exercise: Exercise) -> ExerciseBase:
    return ExerciseBase.model_validate(exercise, from_attributes=True)


def to_exercise_public(exercise: Exercise) -> ExercisePublic:
    sorted_muscle_groups = sorted(
        exercise.muscle_groups,
        key=lambda emg: emg.muscle_group.name,
    )
    return ExercisePublic(
        id=exercise.id,
        user_id=exercise.user_id,
        name=exercise.name,
        description=exercise.description,
        created_at=exercise.created_at,
        updated_at=exercise.updated_at,
        muscle_groups=[
            to_muscle_group_public(emg.muscle_group) for emg in sorted_muscle_groups
        ],
    )


async def create_exercise(
    user_id: int,
    req: CreateExerciseRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Creating exercise '{req.name}' for user {user_id}")

    muscle_groups = await get_muscle_groups_by_ids(req.muscle_group_ids, db)
    if len(muscle_groups) != len(req.muscle_group_ids):
        raise MuscleGroupNotFound()

    exercise = Exercise(
        user_id=user_id,
        name=req.name,
        description=req.description,
    )
    db.add(exercise)

    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise ExerciseNameConflict()

    for mg in muscle_groups:
        db.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=mg.id,
            )
        )

    await db.commit()


async def get_exercises(
    user_id: int,
    db: AsyncSession,
) -> list[ExercisePublic]:
    logger.info(f"Getting exercises for user {user_id}")

    exercises = await query_exercises(
        db,
        False,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    return [to_exercise_public(e) for e in exercises]


async def get_exercise(
    exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> ExercisePublic:
    logger.info(f"Getting exercise {exercise_id} for user {user_id}")

    exercises = await query_exercises(
        db,
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
    db: AsyncSession,
) -> None:
    logger.info(f"Updating exercise {exercise_id} for user {user_id}")

    exercise = await _get_owned_exercise(exercise_id, user_id, db)

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
        muscle_groups = await get_muscle_groups_by_ids(req.muscle_group_ids, db)
        if len(muscle_groups) != len(req.muscle_group_ids):
            raise MuscleGroupNotFound()

        await db.execute(
            delete(ExerciseMuscleGroup).where(
                ExerciseMuscleGroup.exercise_id == exercise_id
            ),
        )
        for mg in muscle_groups:
            db.add(
                ExerciseMuscleGroup(exercise_id=exercise_id, muscle_group_id=mg.id),
            )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ExerciseNameConflict()


async def delete_exercise(
    exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Deleting exercise {exercise_id} for user {user_id}")

    exercise = await _get_owned_exercise(exercise_id, user_id, db)
    await db.delete(exercise)
    await db.commit()
