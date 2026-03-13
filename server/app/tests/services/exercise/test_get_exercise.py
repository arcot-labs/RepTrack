import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNotFound
from app.services.exercise import get_exercise

from .utilities import create_exercise, create_user


async def test_get_exercise(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    result = await get_exercise(exercise.id, user.id, session)

    assert result.id == exercise.id
    assert result.name == "Bench"


async def test_get_exercise_system_exercise(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="System Deadlift",
    )

    result = await get_exercise(exercise.id, user.id, session)

    assert result.id == exercise.id
    assert result.user_id is None


async def test_get_exercise_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(ExerciseNotFound):
        await get_exercise(99999, user.id, session)
