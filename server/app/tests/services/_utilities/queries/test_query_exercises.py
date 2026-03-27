import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.services.utilities.queries import query_exercises

from ...exercise.utilities import create_exercise
from ...muscle_group.utilities import get_muscle_group_id
from ...utilities import create_user


async def test_query_exercises_base(
    db_session: AsyncSession,
):
    exercise = await create_exercise(db_session, "Bench")
    result = await query_exercises(db_session, True)

    assert exercise in result
    with pytest.raises(MissingGreenlet):
        _ = result[0].muscle_groups


async def test_query_exercises_public(
    db_session: AsyncSession,
):
    exercise = await create_exercise(db_session, "Bench")
    result = await query_exercises(db_session, False)

    _exercise = next(e for e in result if e.name == "Bench")
    assert _exercise.muscle_groups == exercise.muscle_groups


async def test_query_exercises_no_where_clause(
    db_session: AsyncSession,
):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")

    mg_id = await get_muscle_group_id(db_session, name="chest")

    await create_exercise(
        db_session,
        name="Bench",
        user_id=user_1.id,
        muscle_group_ids=[mg_id],
    )
    await create_exercise(
        db_session,
        name="Squat",
        user_id=user_2.id,
    )

    result = await query_exercises(db_session, False)

    bench = next(e for e in result if e.name == "Bench")
    squat = next(e for e in result if e.name == "Squat")

    assert len(bench.muscle_groups) == 1
    assert bench.muscle_groups[0].muscle_group_id == mg_id

    assert len(squat.muscle_groups) == 0


async def test_query_exercises_with_where_clause(
    db_session: AsyncSession,
):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Deadlift",
        user_id=user.id,
    )
    await create_exercise(
        db_session,
        name="Curl",
        user_id=user.id,
    )

    result = await query_exercises(
        db_session,
        True,
        Exercise.id == exercise.id,
    )

    assert len(result) == 1
    assert result[0].id == exercise.id


async def test_query_exercises_ordering(db_session: AsyncSession):
    user = await create_user(db_session)

    await create_exercise(
        db_session,
        name="Z Row",
        user_id=user.id,
    )
    await create_exercise(
        db_session,
        name="A Row",
        user_id=user.id,
    )

    result = await query_exercises(
        db_session,
        False,
        Exercise.user_id == user.id,
    )

    names = [e.name for e in result]
    assert names == sorted(names)
