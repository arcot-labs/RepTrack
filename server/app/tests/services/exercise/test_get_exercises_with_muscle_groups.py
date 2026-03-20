from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.services.exercise import (
    _get_exercises_with_muscle_groups,  # pyright: ignore[reportPrivateUsage]
)

from ..utilities import create_user
from .utilities import clear_exercises, create_exercise, get_muscle_group_id


async def test_get_exercises_with_muscle_groups_no_where_clause(
    session: AsyncSession,
):
    await clear_exercises(session)

    user_1 = await create_user(session, username="user_1")
    user_2 = await create_user(session, username="user_2")

    mg_id = await get_muscle_group_id(session, name="chest")

    await create_exercise(
        session,
        name="Bench",
        user_id=user_1.id,
        muscle_group_ids=[mg_id],
    )
    await create_exercise(
        session,
        name="Squat",
        user_id=user_2.id,
    )

    result = await _get_exercises_with_muscle_groups(session)

    names = [e.name for e in result]
    assert len(result) == 2
    assert "Bench" in names
    assert "Squat" in names

    assert len(result[0].muscle_groups) == 1
    assert result[0].muscle_groups[0].muscle_group_id == mg_id

    assert len(result[1].muscle_groups) == 0


async def test_get_exercises_with_muscle_groups_with_where_clause(
    session: AsyncSession,
):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Deadlift",
        user_id=user.id,
    )
    await create_exercise(
        session,
        name="Curl",
        user_id=user.id,
    )

    result = await _get_exercises_with_muscle_groups(
        session,
        Exercise.id == exercise.id,
    )

    assert len(result) == 1
    assert result[0].id == exercise.id


async def test_get_exercises_with_muscle_groups_ordering(session: AsyncSession):
    user = await create_user(session)

    await create_exercise(
        session,
        name="Z Row",
        user_id=user.id,
    )
    await create_exercise(
        session,
        name="A Row",
        user_id=user.id,
    )

    result = await _get_exercises_with_muscle_groups(
        session, Exercise.user_id == user.id
    )

    names = [e.name for e in result]
    assert names == sorted(names)
