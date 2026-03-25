import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import (
    WorkoutExerciseNotFound,
    WorkoutNotFound,
)
from app.services.workout_exercise import (
    delete_workout_exercise,
)

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout


async def test_delete_workout_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Squat")
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    db_session.add(workout_exercise)
    await db_session.commit()

    await delete_workout_exercise(workout.id, workout_exercise.id, user.id, db_session)

    result = await db_session.execute(
        select(WorkoutExercise).where(
            WorkoutExercise.id == workout_exercise.id,
        )
    )
    assert result.scalar_one_or_none() is None


async def test_delete_workout_exercise_workout_not_found(db_session: AsyncSession):
    with pytest.raises(WorkoutNotFound):
        await delete_workout_exercise(
            workout_id=1,
            workout_exercise_id=2,
            user_id=3,
            db_session=db_session,
        )


async def test_delete_workout_exercise_workout_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_2.id)

    with pytest.raises(WorkoutNotFound):
        await delete_workout_exercise(
            workout_id=workout.id,
            workout_exercise_id=1,
            user_id=user_1.id,
            db_session=db_session,
        )


async def test_delete_workout_exercise_not_found(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)

    with pytest.raises(WorkoutExerciseNotFound):
        await delete_workout_exercise(workout.id, 99999, user.id, db_session)
