from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise
from app.services.workout_exercise import (
    _get_next_workout_exercise_position,  # pyright: ignore[reportPrivateUsage]
)

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout


async def test_get_next_workout_exercise_position_empty(session: AsyncSession):
    user = await create_user(session)
    workout = await create_workout(session, user_id=user.id)

    position = await _get_next_workout_exercise_position(workout.id, session)
    assert position == 1


async def test_get_next_workout_exercise_position_max(session: AsyncSession):
    user = await create_user(session)
    workout = await create_workout(session, user_id=user.id)
    other_workout = await create_workout(session, user_id=user.id)
    exercise_1 = await create_exercise(session, name="Squat")
    exercise_2 = await create_exercise(session, name="Bench")
    exercise_3 = await create_exercise(session, name="Deadlift")

    session.add_all(
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
    await session.commit()

    position = await _get_next_workout_exercise_position(workout.id, session)
    assert position == 4
