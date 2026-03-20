import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import WorkoutNotFound
from app.services.workout import get_workout

from ..utilities import create_user
from .utilities import create_workout


async def test_get_workout(session: AsyncSession):
    user = await create_user(session)
    workout = await create_workout(
        session,
        user_id=user.id,
        notes="Test workout",
    )

    result = await get_workout(workout.id, user.id, session)

    assert result.id == workout.id
    assert result.notes == "Test workout"


async def test_get_workout_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(WorkoutNotFound):
        await get_workout(999, user.id, session)


async def test_get_workout_other_user(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")
    workout = await create_workout(session, user.id)

    with pytest.raises(WorkoutNotFound):
        await get_workout(workout.id, user_2.id, session)
