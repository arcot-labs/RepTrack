import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.models.errors import WorkoutNotFound
from app.services.workout import (
    _query_workouts,  # pyright: ignore[reportPrivateUsage]
    delete_workout,
)

from ..utilities import create_user
from .utilities import create_workout


async def test_delete_workout(session: AsyncSession):
    user = await create_user(session)
    workout = await create_workout(session, user.id)

    await delete_workout(workout.id, user.id, session)

    workouts = await _query_workouts(session, True, Workout.id == workout.id)
    assert workouts == []


async def test_delete_workout_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(WorkoutNotFound):
        await delete_workout(99999, user.id, session)


async def test_delete_workout_not_allowed(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")

    workout = await create_workout(session, user.id)

    with pytest.raises(WorkoutNotFound):
        await delete_workout(workout.id, user_2.id, session)
