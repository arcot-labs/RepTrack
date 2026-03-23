from sqlalchemy.ext.asyncio import AsyncSession

from app.services.workout import get_workouts

from ..utilities import create_user
from .utilities import create_workout


async def test_get_workouts(
    session: AsyncSession,
):
    user_1 = await create_user(session, username="user_1")
    user_2 = await create_user(session, username="user_2")

    workout_1 = await create_workout(session, user_1.id)
    await create_workout(session, user_2.id)

    result = await get_workouts(user_1.id, session)

    assert len(result) == 1
    assert result[0].id == workout_1.id
    assert result[0].notes == workout_1.notes
