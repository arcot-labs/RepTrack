import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.services.utilities.queries import query_exercises

from ...exercise.utilities import create_exercise, get_muscle_group_id
from ...utilities import create_user


async def test_query_exercises_base(
    session: AsyncSession,
):
    exercise = await create_exercise(session, "Bench")
    result = await query_exercises(session, True)

    assert len(result) == 1
    assert exercise in result
    with pytest.raises(MissingGreenlet):
        _ = result[0].muscle_groups


async def test_query_exercises_public(
    session: AsyncSession,
):
    exercise = await create_exercise(session, "Bench")
    result = await query_exercises(session, False)

    assert len(result) == 1
    assert exercise in result
    assert result[0].muscle_groups == exercise.muscle_groups


async def test_query_exercises_no_where_clause(
    session: AsyncSession,
):
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

    result = await query_exercises(session, False)

    names = [e.name for e in result]
    assert len(result) == 2
    assert "Bench" in names
    assert "Squat" in names

    assert len(result[0].muscle_groups) == 1
    assert result[0].muscle_groups[0].muscle_group_id == mg_id

    assert len(result[1].muscle_groups) == 0


async def test_query_exercises_with_where_clause(
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

    result = await query_exercises(
        session,
        True,
        Exercise.id == exercise.id,
    )

    assert len(result) == 1
    assert result[0].id == exercise.id


async def test_query_exercises_ordering(session: AsyncSession):
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

    result = await query_exercises(
        session,
        False,
        Exercise.user_id == user.id,
    )

    names = [e.name for e in result]
    assert names == sorted(names)
