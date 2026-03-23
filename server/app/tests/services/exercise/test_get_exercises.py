from sqlalchemy.ext.asyncio import AsyncSession

from app.services.exercise import get_exercises

from ..utilities import create_user
from .utilities import create_exercise


async def test_get_exercises(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")

    await create_exercise(session, name="System Squat")
    user_exercise = await create_exercise(
        session,
        name="User Curl",
        user_id=user.id,
    )
    await create_exercise(
        session,
        name="Other Curl",
        user_id=user_2.id,
    )

    result = await get_exercises(user.id, session)

    ids = [exercise.id for exercise in result]
    assert len(ids) == 2
    assert any(exercise.user_id is None for exercise in result)
    assert user_exercise.id in ids
    assert all(exercise.name != "Other Curl" for exercise in result)


async def test_get_exercises_ordering(session: AsyncSession):
    user = await create_user(session)

    await create_exercise(
        session,
        name="Z Press",
        user_id=user.id,
    )
    await create_exercise(
        session,
        name="A Press",
        user_id=user.id,
    )

    result = await get_exercises(user.id, session)

    names = [exercise.name for exercise in result]
    assert names == sorted(names)
