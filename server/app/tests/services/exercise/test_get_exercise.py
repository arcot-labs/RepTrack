import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNotFound
from app.services.exercise import get_exercise

from ..utilities import create_user
from .utilities import create_exercise


async def test_get_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    result = await get_exercise(exercise.id, user.id, db_session)

    assert result.id == exercise.id
    assert result.name == "Bench"


async def test_get_exercise_system_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="System Deadlift",
    )

    result = await get_exercise(exercise.id, user.id, db_session)

    assert result.id == exercise.id
    assert result.user_id is None


async def test_get_exercise_not_found(db_session: AsyncSession):
    user = await create_user(db_session)

    with pytest.raises(ExerciseNotFound):
        await get_exercise(99999, user.id, db_session)


async def test_get_exercise_not_allowed(db_session: AsyncSession):
    owner = await create_user(db_session, username="owner")
    other = await create_user(db_session, username="other")
    exercise = await create_exercise(
        db_session,
        name="Other Exercise",
        user_id=owner.id,
    )

    with pytest.raises(ExerciseNotFound):
        await get_exercise(exercise.id, other.id, db_session)
