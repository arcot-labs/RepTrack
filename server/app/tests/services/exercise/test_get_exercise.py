import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNotFound
from app.services.exercise import get_exercise

from ..utilities import create_user
from .utilities import create_exercise


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


async def test_get_exercise_other_user(session: AsyncSession):
    owner = await create_user(session, username="owner")
    other = await create_user(session, username="other")
    exercise = await create_exercise(
        session,
        name="Other Exercise",
        user_id=owner.id,
    )

    with pytest.raises(ExerciseNotFound):
        await get_exercise(exercise.id, other.id, session)
