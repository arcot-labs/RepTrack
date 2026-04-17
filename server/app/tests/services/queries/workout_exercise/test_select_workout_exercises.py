import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.database.workout_exercise import WorkoutExercise
from app.services.queries.workout_exercise import select_workout_exercises

from ...exercise.utilities import create_exercise
from ...set.utilities import create_set
from ...utilities import create_user
from ...workout.utilities import create_workout
from ...workout_exercise.utilities import create_workout_exercise


async def test_select_workout_exercises_base(
    db_session: AsyncSession,
    db_session_factory: async_sessionmaker[AsyncSession],
):
    user = await create_user(db_session)
    exercise = await create_exercise(db_session, "Bench")
    workout = await create_workout(db_session, user_id=user.id)
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
        notes="Workout Exercise",
    )

    async with db_session_factory() as read_session:
        result = await select_workout_exercises(read_session, True, False)

        assert len(result) == 1
        assert result[0].id == workout_exercise.id
        with pytest.raises(MissingGreenlet):
            _ = result[0].exercise
        with pytest.raises(MissingGreenlet):
            _ = result[0].sets


async def test_select_workout_exercises_public(
    db_session: AsyncSession,
    db_session_factory: async_sessionmaker[AsyncSession],
):
    user = await create_user(db_session)
    exercise = await create_exercise(db_session, "Bench")
    workout = await create_workout(db_session, user_id=user.id)
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
        notes="Workout Exercise",
    )
    workout_set = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )

    async with db_session_factory() as read_session:
        result = await select_workout_exercises(read_session, False, False)

        assert len(result) == 1
        assert result[0].id == workout_exercise.id
        assert result[0].exercise.id == exercise.id
        assert result[0].sets[0].id == workout_set.id


async def test_select_workout_exercises_no_where_clause(
    db_session: AsyncSession,
):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    exercise_1 = await create_exercise(db_session, "Bench")
    exercise_2 = await create_exercise(db_session, "Squat")
    workout_1 = await create_workout(db_session, user_id=user_1.id, notes="Workout 1")
    workout_2 = await create_workout(db_session, user_id=user_2.id, notes="Workout 2")

    workout_exercise_1 = await create_workout_exercise(
        db_session,
        workout_id=workout_1.id,
        exercise_id=exercise_1.id,
        position=1,
        notes="Workout 1 Exercise",
    )
    workout_exercise_2 = await create_workout_exercise(
        db_session,
        workout_id=workout_2.id,
        exercise_id=exercise_2.id,
        position=2,
        notes="Workout 2 Exercise",
    )

    set_1 = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise_1.id,
        set_number=1,
    )
    set_2 = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise_2.id,
        set_number=2,
    )

    workout_exercises = await select_workout_exercises(db_session, False, False)

    assert len(workout_exercises) == 2

    assert workout_exercises[0].workout == workout_1
    assert workout_exercises[0].exercise == exercise_1
    assert workout_exercises[0].sets == [set_1]
    assert workout_exercises[0].position == 1
    assert workout_exercises[0].notes == "Workout 1 Exercise"

    assert workout_exercises[1].workout == workout_2
    assert workout_exercises[1].exercise == exercise_2
    assert workout_exercises[1].sets == [set_2]
    assert workout_exercises[1].position == 2
    assert workout_exercises[1].notes == "Workout 2 Exercise"


async def test_select_workout_exercises_with_where_clause(
    db_session: AsyncSession,
):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    exercise_1 = await create_exercise(db_session, "Bench")
    exercise_2 = await create_exercise(db_session, "Squat")
    workout_1 = await create_workout(db_session, user_id=user_1.id, notes="Workout 1")
    workout_2 = await create_workout(db_session, user_id=user_2.id, notes="Workout 2")

    workout_exercise_1 = await create_workout_exercise(
        db_session,
        workout_id=workout_1.id,
        exercise_id=exercise_1.id,
        position=1,
        notes="Workout 1 Exercise",
    )
    await create_workout_exercise(
        db_session,
        workout_id=workout_2.id,
        exercise_id=exercise_2.id,
        position=2,
        notes="Workout 2 Exercise",
    )

    workout_exercises = await select_workout_exercises(
        db_session,
        True,
        False,
        WorkoutExercise.workout_id == workout_1.id,
    )

    assert len(workout_exercises) == 1
    assert workout_exercises[0].id == workout_exercise_1.id


async def test_select_workout_exercises_ordering(
    db_session: AsyncSession,
):
    user = await create_user(db_session)
    exercise = await create_exercise(db_session, "Bench")
    workout = await create_workout(db_session, user_id=user.id)

    await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=2,
    )
    await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    result = await select_workout_exercises(
        db_session,
        True,
        True,
    )

    positions = [we.position for we in result]
    assert positions == [1, 2]
