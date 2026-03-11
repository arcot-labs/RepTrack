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
    ExerciseUpdateNotAllowed,
    MuscleGroupNotFound,
)
from app.models.schemas.exercise import (
    CreateExerciseRequest,
    ExercisePublic,
    MuscleGroupPublic,
    UpdateExerciseRequest,
)
from app.services.muscle_group import get_muscle_groups_by_ids

logger = logging.getLogger(__name__)


async def _get_exercises_with_muscle_groups(
    db: AsyncSession,
    *where_clauses: Any,
) -> Sequence[Exercise]:
    result = await db.execute(
        select(Exercise)
        .options(
            selectinload(Exercise.muscle_groups).selectinload(
                ExerciseMuscleGroup.muscle_group
            )
        )
        .where(*where_clauses)
        .order_by(Exercise.name)
    )
    return result.scalars().all()


def _to_exercise_public(exercise: Exercise) -> ExercisePublic:
    return ExercisePublic(
        id=exercise.id,
        user_id=exercise.user_id,
        name=exercise.name,
        description=exercise.description,
        muscle_groups=[
            MuscleGroupPublic.model_validate(emg.muscle_group, from_attributes=True)
            for emg in exercise.muscle_groups
        ],
        created_at=exercise.created_at,
        updated_at=exercise.updated_at,
    )


async def create_exercise(
    user_id: int,
    req: CreateExerciseRequest,
    db: AsyncSession,
) -> ExercisePublic:
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

    exercises = await _get_exercises_with_muscle_groups(
        db,
        Exercise.id == exercise.id,
    )
    return _to_exercise_public(exercises[0])


async def get_exercises(
    user_id: int,
    db: AsyncSession,
) -> list[ExercisePublic]:
    logger.info(f"Getting exercises for user {user_id}")

    exercises = await _get_exercises_with_muscle_groups(
        db,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    return [_to_exercise_public(e) for e in exercises]


async def get_exercise(
    exercise_id: int,
    user_id: int,
    db: AsyncSession,
) -> ExercisePublic:
    logger.info(f"Getting exercise {exercise_id} for user {user_id}")

    exercises = await _get_exercises_with_muscle_groups(
        db,
        Exercise.id == exercise_id,
        (Exercise.user_id.is_(None)) | (Exercise.user_id == user_id),
    )
    if not exercises:
        raise ExerciseNotFound()
    return _to_exercise_public(exercises[0])


async def update_exercise(
    exercise_id: int,
    user_id: int,
    req: UpdateExerciseRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Updating exercise {exercise_id} for user {user_id}")

    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id),
    )
    exercise = result.scalar_one_or_none()

    if not exercise:
        raise ExerciseNotFound()
    if exercise.user_id != user_id:
        raise ExerciseUpdateNotAllowed()

    if req.name is not None:
        exercise.name = req.name
    if req.description is not None:
        exercise.description = req.description
    if req.muscle_group_ids is not None:
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


async def delete_exercise(exercise_id: int, user_id: int, db: AsyncSession) -> None:
    logger.info(f"Deleting exercise {exercise_id} for user {user_id}")

    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id),
    )
    exercise = result.scalar_one_or_none()

    if not exercise:
        raise ExerciseNotFound()
    if exercise.user_id != user_id:
        raise ExerciseUpdateNotAllowed()

    await db.delete(exercise)
    await db.commit()
