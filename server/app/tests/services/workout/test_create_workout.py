from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.models.schemas.workout import CreateWorkoutRequest
from app.services.queries.workout import select_workouts
from app.services.workout import (
    create_workout,
)

from ..utilities import create_user


async def test_create_workout(db_session: AsyncSession):
    user = await create_user(db_session)
    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await create_workout(
        user.id,
        CreateWorkoutRequest(
            started_at=started_at,
            ended_at=ended_at,
            notes="Test workout",
        ),
        db_session,
    )

    workouts = await select_workouts(db_session, False, Workout.user_id == user.id)
    workout = workouts[0] if workouts else None

    assert workout is not None
    assert workout.user_id == user.id
    assert workout.started_at == started_at
    assert workout.ended_at == ended_at
    assert workout.notes == "Test workout"
