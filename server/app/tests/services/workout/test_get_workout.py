import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import WorkoutNotFound
from app.services.workout import get_workout

from ..utilities import create_user
from .utilities import create_workout


async def test_get_workout(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        notes="Test workout",
    )

    result = await get_workout(workout.id, user.id, db_session)

    assert result.id == workout.id
    assert result.notes == "Test workout"


async def test_get_workout_not_found(db_session: AsyncSession):
    user = await create_user(db_session)

    with pytest.raises(WorkoutNotFound):
        await get_workout(999, user.id, db_session)


async def test_get_workout_not_allowed(db_session: AsyncSession):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user.id)

    with pytest.raises(WorkoutNotFound):
        await get_workout(workout.id, user_2.id, db_session)
