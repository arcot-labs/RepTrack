from datetime import datetime, timedelta

import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout
from app.services.workout import _get_workouts  # pyright: ignore[reportPrivateUsage]

from ..utilities import create_user
from .utilities import create_workout


async def test_get_workouts_base(
    session: AsyncSession,
):
    user = await create_user(session)
    workout = await create_workout(session, user.id)

    result = await _get_workouts(session, True)

    assert len(result) == 1
    assert workout in result
    with pytest.raises(MissingGreenlet):
        _ = result[0].exercises


async def test_get_workouts_public(
    session: AsyncSession,
):
    user = await create_user(session)
    workout = await create_workout(session, user.id)

    result = await _get_workouts(session, False)

    assert len(result) == 1
    assert workout in result
    assert result[0].exercises == workout.exercises


async def test_get_workouts_no_where_clause(
    session: AsyncSession,
):
    user_1 = await create_user(session, "user_1")
    user_2 = await create_user(session, "user_2")

    workout_1 = await create_workout(session, user_1.id)
    workout_2 = await create_workout(session, user_2.id)

    result = await _get_workouts(session, True)

    assert len(result) == 2
    assert workout_1 in result
    assert workout_2 in result


async def test_get_workouts_with_where_clause(
    session: AsyncSession,
):
    user_1 = await create_user(session, "user_1")
    user_2 = await create_user(session, "user_2")

    workout_1 = await create_workout(session, user_1.id)
    workout_2 = await create_workout(session, user_2.id)

    result = await _get_workouts(session, True, Workout.user_id == user_1.id)

    assert len(result) == 1
    assert workout_1 in result
    assert workout_2 not in result


async def test_get_workouts_ordering(
    session: AsyncSession,
):
    user_1 = await create_user(session, "user_1")
    user_2 = await create_user(session, "user_2")

    await create_workout(
        session,
        user_1.id,
        started_at=datetime.now(),
    )
    await create_workout(
        session,
        user_2.id,
        started_at=datetime.now() + timedelta(minutes=5),
    )

    result = await _get_workouts(session, True)

    assert result == sorted(result, key=lambda w: w.started_at, reverse=True)
