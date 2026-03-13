import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.errors import ExerciseNotFound, ExerciseUpdateNotAllowed
from app.services.exercise import delete_exercise

from .utilities import create_exercise, create_user


async def test_delete_exercise(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    await delete_exercise(exercise.id, user.id, session)

    result = await session.execute(
        select(Exercise).where(Exercise.id == exercise.id),
    )
    assert result.scalar_one_or_none() is None


async def test_delete_exercise_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(ExerciseNotFound):
        await delete_exercise(99999, user.id, session)


async def test_delete_exercise_not_allowed(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")

    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(ExerciseUpdateNotAllowed):
        await delete_exercise(exercise.id, user_2.id, session)
