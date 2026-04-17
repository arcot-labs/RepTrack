import logging
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.models.errors import WorkoutNotFound
from app.models.schemas.workout import (
    CreateWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutBase,
    WorkoutPublic,
)
from app.services.queries.workout import (
    select_workout_by_id,
    select_workouts,
)
from app.services.utilities.serializers import to_workout_base, to_workout_public

logger = logging.getLogger(__name__)


async def get_owned_workout(
    workout_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> Workout:
    workout = await select_workout_by_id(db_session, workout_id)
    if not workout or workout.user_id != user_id:
        raise WorkoutNotFound()
    return workout


async def create_workout(
    user_id: int,
    req: CreateWorkoutRequest,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Creating workout for user {user_id}")

    workout = Workout(
        user_id=user_id,
        started_at=req.started_at or datetime.now(UTC),
        ended_at=req.ended_at,
        notes=req.notes,
    )
    db_session.add(workout)
    await db_session.commit()


async def get_workouts(
    user_id: int,
    db_session: AsyncSession,
) -> list[WorkoutBase]:
    logger.info(f"Getting workouts for user {user_id}")

    workouts = await select_workouts(
        db_session,
        True,
        Workout.user_id == user_id,
    )
    return [to_workout_base(w) for w in workouts]


async def get_workout(
    workout_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> WorkoutPublic:
    logger.info(f"Getting workout {workout_id} for user {user_id}")

    workouts = await select_workouts(
        db_session,
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
    db_session: AsyncSession,
) -> None:
    logger.info(f"Updating workout {workout_id} for user {user_id}")

    workout = await get_owned_workout(workout_id, user_id, db_session)

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

    await db_session.commit()


async def delete_workout(
    workout_id: int,
    user_id: int,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Deleting workout {workout_id} for user {user_id}")

    workout = await get_owned_workout(workout_id, user_id, db_session)
    await db_session.delete(workout)
    await db_session.commit()
