import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNotFound
from app.services.exercise import (
    _get_owned_exercise,  # pyright: ignore[reportPrivateUsage]
)

from ..utilities import create_user
from .utilities import create_exercise


async def test_get_owned_exercise(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Owned Exercise",
        user_id=user.id,
    )

    result = await _get_owned_exercise(exercise.id, user.id, session)

    assert result.id == exercise.id
    assert result.user_id == user.id


async def test_get_owned_exercise_not_found(
    session: AsyncSession,
):
    user = await create_user(session)

    with pytest.raises(ExerciseNotFound):
        await _get_owned_exercise(99999, user.id, session)


async def test_get_owned_exercise_not_allowed(session: AsyncSession):
    owner = await create_user(session, username="owner")
    other = await create_user(session, username="other")
    exercise = await create_exercise(
        session,
        name="Other Exercise",
        user_id=owner.id,
    )

    with pytest.raises(ExerciseNotFound):
        await _get_owned_exercise(exercise.id, other.id, session)
