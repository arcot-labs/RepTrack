import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNotFound
from app.services.exercise import (
    _get_owned_exercise,  # pyright: ignore[reportPrivateUsage]
)

from ..utilities import create_user
from .utilities import create_exercise


async def test_get_owned_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Owned Exercise",
        user_id=user.id,
    )

    result = await _get_owned_exercise(exercise.id, user.id, db_session)

    assert result.id == exercise.id
    assert result.user_id == user.id


async def test_get_owned_exercise_not_found(
    db_session: AsyncSession,
):
    user = await create_user(db_session)

    with pytest.raises(ExerciseNotFound):
        await _get_owned_exercise(99999, user.id, db_session)


async def test_get_owned_exercise_not_allowed(db_session: AsyncSession):
    owner = await create_user(db_session, username="owner")
    other = await create_user(db_session, username="other")
    exercise = await create_exercise(
        db_session,
        name="Other Exercise",
        user_id=owner.id,
    )

    with pytest.raises(ExerciseNotFound):
        await _get_owned_exercise(exercise.id, other.id, db_session)
