import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.models.errors import WorkoutNotFound
from app.services.queries.workout import select_workouts
from app.services.workout import (
    delete_workout,
)

from ..utilities import create_user
from .utilities import create_workout


async def test_delete_workout(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user.id)

    await delete_workout(workout.id, user.id, db_session)

    workouts = await select_workouts(db_session, True, Workout.id == workout.id)
    assert workouts == []


async def test_delete_workout_not_found(db_session: AsyncSession):
    user = await create_user(db_session)

    with pytest.raises(WorkoutNotFound):
        await delete_workout(99999, user.id, db_session)


async def test_delete_workout_not_allowed(db_session: AsyncSession):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")

    workout = await create_workout(db_session, user.id)

    with pytest.raises(WorkoutNotFound):
        await delete_workout(workout.id, user_2.id, db_session)
