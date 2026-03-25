from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.services.set import (
    _get_next_set_number,  # pyright: ignore[reportPrivateUsage]
)
from app.tests.api.workout_exercise.utilities import create_workout_exercise

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout


async def test_get_next_set_number_empty(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Squat")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set_number = await _get_next_set_number(workout_exercise.id, db_session)
    assert set_number == 1


async def test_get_next_set_number_max(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Squat")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    other_workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=2,
    )

    db_session.add_all(
        [
            Set(workout_exercise_id=workout_exercise.id, set_number=1),
            Set(workout_exercise_id=workout_exercise.id, set_number=3),
            Set(workout_exercise_id=other_workout_exercise.id, set_number=5),
        ]
    )
    await db_session.commit()

    set_number = await _get_next_set_number(workout_exercise.id, db_session)
    assert set_number == 4
