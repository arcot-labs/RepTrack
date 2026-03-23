import logging
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.workout import Workout
from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import WorkoutNotFound
from app.models.schemas.workout import (
    CreateWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutBase,
    WorkoutPublic,
)
from app.services.utilities.queries import get_owned_workout
from app.services.utilities.serializers import to_workout_base, to_workout_public

logger = logging.getLogger(__name__)


async def _query_workouts(
    db: AsyncSession,
    base: bool,
    *where_clauses: Any,
) -> Sequence[Workout]:
    query = select(Workout).where(*where_clauses).order_by(Workout.started_at.desc())
    if not base:
        query = query.options(
            selectinload(Workout.exercises).selectinload(WorkoutExercise.exercise),
            selectinload(Workout.exercises).selectinload(WorkoutExercise.sets),
        )
    result = await db.execute(query)
    return result.scalars().all()


async def create_workout(
    user_id: int,
    req: CreateWorkoutRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Creating workout for user {user_id}")

    workout = Workout(
        user_id=user_id,
        started_at=req.started_at or datetime.now(UTC),
        ended_at=req.ended_at,
        notes=req.notes,
    )
    db.add(workout)
    await db.commit()


async def get_workouts(
    user_id: int,
    db: AsyncSession,
) -> list[WorkoutBase]:
    logger.info(f"Getting workouts for user {user_id}")

    workouts = await _query_workouts(
        db,
        True,
        Workout.user_id == user_id,
    )
    return [to_workout_base(w) for w in workouts]


async def get_workout(
    workout_id: int,
    user_id: int,
    db: AsyncSession,
) -> WorkoutPublic:
    logger.info(f"Getting workout {workout_id} for user {user_id}")

    workouts = await _query_workouts(
        db,
        False,
        Workout.id == workout_id,
        Workout.user_id == user_id,
    )
    if not workouts:
        raise WorkoutNotFound()
    return to_workout_public(workouts[0])


async def update_workout(
    workout_id: int,
    user_id: int,
    req: UpdateWorkoutRequest,
    db: AsyncSession,
) -> None:
    logger.info(f"Updating workout {workout_id} for user {user_id}")

    workout = await get_owned_workout(workout_id, user_id, db)

    if not req.model_fields_set:
        logger.info("No changes provided, skipping update")
        return

    if "started_at" in req.model_fields_set:
        assert req.started_at is not None
        workout.started_at = req.started_at

    if "ended_at" in req.model_fields_set:
        workout.ended_at = req.ended_at

    if "notes" in req.model_fields_set:
        workout.notes = req.notes

    await db.commit()


async def delete_workout(
    workout_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Deleting workout {workout_id} for user {user_id}")

    workout = await get_owned_workout(workout_id, user_id, db)
    await db.delete(workout)
    await db.commit()
