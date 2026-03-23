import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import WorkoutNotFound
from app.services.workout import get_owned_workout

from ..utilities import create_user
from .utilities import create_workout


async def test_get_owned_workouts(
    session: AsyncSession,
):
    user = await create_user(session)
    workout = await create_workout(session, user.id)

    result = await get_owned_workout(workout.id, user.id, session)

    assert result == workout


async def test_get_owned_workout_not_found(
    session: AsyncSession,
):
    with pytest.raises(WorkoutNotFound):
        await get_owned_workout(999, 1, session)


async def test_get_owned_workout_not_owned(
    session: AsyncSession,
):
    user_1 = await create_user(session, "user_1")
    user_2 = await create_user(session, "user_2")

    workout = await create_workout(session, user_1.id)

    with pytest.raises(WorkoutNotFound):
        await get_owned_workout(workout.id, user_2.id, session)
