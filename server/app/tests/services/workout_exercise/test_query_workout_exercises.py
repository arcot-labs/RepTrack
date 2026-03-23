from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise
from app.services.workout_exercise import query_workout_exercises

from ..exercise.utilities import create_exercise
from ..set.utilities import create_set
from ..utilities import create_user
from ..workout.utilities import create_workout
from .utilities import create_workout_exercise


async def test_query_workout_exercises_no_where_clause(
    session: AsyncSession,
):
    user_1 = await create_user(session, username="user_1")
    user_2 = await create_user(session, username="user_2")
    exercise_1 = await create_exercise(session, "Bench")
    exercise_2 = await create_exercise(session, "Squat")
    workout_1 = await create_workout(session, user_id=user_1.id, notes="Workout 1")
    workout_2 = await create_workout(session, user_id=user_2.id, notes="Workout 2")

    workout_exercise_1 = await create_workout_exercise(
        session,
        workout_id=workout_1.id,
        exercise_id=exercise_1.id,
        position=1,
        notes="Workout 1 Exercise",
    )
    workout_exercise_2 = await create_workout_exercise(
        session,
        workout_id=workout_2.id,
        exercise_id=exercise_2.id,
        position=2,
        notes="Workout 2 Exercise",
    )

    set_1 = await create_set(
        session=session,
        workout_exercise_id=workout_exercise_1.id,
        set_number=1,
    )
    set_2 = await create_set(
        session=session,
        workout_exercise_id=workout_exercise_2.id,
        set_number=2,
    )

    workout_exercises = await query_workout_exercises(session)

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


async def test_query_workout_exercises_with_where_clause(
    session: AsyncSession,
):
    user_1 = await create_user(session, username="user_1")
    user_2 = await create_user(session, username="user_2")
    exercise_1 = await create_exercise(session, "Bench")
    exercise_2 = await create_exercise(session, "Squat")
    workout_1 = await create_workout(session, user_id=user_1.id, notes="Workout 1")
    workout_2 = await create_workout(session, user_id=user_2.id, notes="Workout 2")

    workout_exercise_1 = await create_workout_exercise(
        session,
        workout_id=workout_1.id,
        exercise_id=exercise_1.id,
        position=1,
        notes="Workout 1 Exercise",
    )
    await create_workout_exercise(
        session,
        workout_id=workout_2.id,
        exercise_id=exercise_2.id,
        position=2,
        notes="Workout 2 Exercise",
    )

    workout_exercises = await query_workout_exercises(
        session,
        WorkoutExercise.workout_id == workout_1.id,
    )

    assert len(workout_exercises) == 1
    assert workout_exercises[0].id == workout_exercise_1.id


async def test_query_workout_exercises_ordering(
    session: AsyncSession,
):
    user = await create_user(session)
    exercise = await create_exercise(session, "Bench")
    workout = await create_workout(session, user_id=user.id)

    await create_workout_exercise(
        session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=2,
    )
    await create_workout_exercise(
        session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    result = await query_workout_exercises(session)

    positions = [we.position for we in result]
    assert positions == [1, 2]
