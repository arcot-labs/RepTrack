from sqlalchemy.ext.asyncio import AsyncSession

from app.services.exercise import get_exercises

from ..utilities import create_user
from .utilities import create_exercise


async def test_get_exercises(db_session: AsyncSession):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")

    await create_exercise(db_session, name="System Squat")
    user_exercise = await create_exercise(
        db_session,
        name="User Curl",
        user_id=user.id,
    )
    await create_exercise(
        db_session,
        name="Other Curl",
        user_id=user_2.id,
    )

    result = await get_exercises(user.id, db_session)

    ids = [exercise.id for exercise in result]
    assert any(exercise.user_id is None for exercise in result)
    assert user_exercise.id in ids
    assert all(exercise.name != "Other Curl" for exercise in result)


async def test_get_exercises_ordering(db_session: AsyncSession):
    user = await create_user(db_session)

    await create_exercise(
        db_session,
        name="z squat",
    )
    await create_exercise(
        db_session,
        name="z press",
        user_id=user.id,
    )
    await create_exercise(
        db_session,
        name="a press",
        user_id=user.id,
    )

    exercises = await get_exercises(user.id, db_session)

    user_exercises = sorted([e.name for e in exercises if e.user_id == user.id])
    system_exercises = sorted([e.name for e in exercises if e.user_id is None])

    names = [e.name for e in exercises]
    assert names == user_exercises + system_exercises
