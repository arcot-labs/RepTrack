from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.models.schemas.workout import CreateWorkoutRequest
from app.services.workout import (  # pyright: ignore[reportPrivateUsage]
    _get_workouts,
    create_workout,
)

from ..utilities import create_user


async def test_create_workout(session: AsyncSession):
    user = await create_user(session)
    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await create_workout(
        user.id,
        CreateWorkoutRequest(
            started_at=started_at,
            ended_at=ended_at,
            notes="Test workout",
        ),
        session,
    )

    workouts = await _get_workouts(session, False, Workout.user_id == user.id)
    workout = workouts[0] if workouts else None

    assert workout is not None
    assert workout.user_id == user.id
    assert workout.started_at == started_at
    assert workout.ended_at == ended_at
    assert workout.notes == "Test workout"
