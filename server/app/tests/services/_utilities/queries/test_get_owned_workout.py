import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import WorkoutNotFound
from app.services.utilities.queries import get_owned_workout

from ...utilities import create_user
from ...workout.utilities import create_workout


async def test_get_owned_workouts(
    db_session: AsyncSession,
):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user.id)

    result = await get_owned_workout(workout.id, user.id, db_session)

    assert result == workout


async def test_get_owned_workout_not_found(
    db_session: AsyncSession,
):
    with pytest.raises(WorkoutNotFound):
        await get_owned_workout(999, 1, db_session)


async def test_get_owned_workout_not_owned(
    db_session: AsyncSession,
):
    user_1 = await create_user(db_session, "user_1")
    user_2 = await create_user(db_session, "user_2")

    workout = await create_workout(db_session, user_1.id)

    with pytest.raises(WorkoutNotFound):
        await get_owned_workout(workout.id, user_2.id, db_session)
