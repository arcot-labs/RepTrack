from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise
from app.services.queries.workout_exercise import (
    select_next_workout_exercise_position,
)

from ...exercise.utilities import create_exercise
from ...utilities import create_user
from ...workout.utilities import create_workout


async def test_select_next_workout_exercise_position_empty(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)

    position = await select_next_workout_exercise_position(db_session, workout.id)
    assert position == 1


async def test_select_next_workout_exercise_position_max(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    other_workout = await create_workout(db_session, user_id=user.id)
    exercise_1 = await create_exercise(db_session, name="Squat")
    exercise_2 = await create_exercise(db_session, name="Bench")
    exercise_3 = await create_exercise(db_session, name="Deadlift")

    db_session.add_all(
        [
            WorkoutExercise(
                workout_id=workout.id,
                exercise_id=exercise_1.id,
                position=1,
            ),
            WorkoutExercise(
                workout_id=workout.id,
                exercise_id=exercise_2.id,
                position=3,
            ),
            WorkoutExercise(
                workout_id=other_workout.id,
                exercise_id=exercise_3.id,
                position=10,
            ),
        ]
    )
    await db_session.commit()

    position = await select_next_workout_exercise_position(db_session, workout.id)
    assert position == 4
