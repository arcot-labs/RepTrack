import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.models.errors import (
    SetNotFound,
    WorkoutNotFound,
)
from app.services.set import delete_set

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout
from ..workout_exercise.utilities import create_workout_exercise
from .utilities import create_set


async def test_delete_set(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )

    await delete_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        db_session=db_session,
    )

    result = await db_session.execute(
        select(Set).where(
            Set.id == set_.id,
        )
    )
    assert result.scalar_one_or_none() is None


async def test_delete_set_workout_not_found(db_session: AsyncSession):
    with pytest.raises(WorkoutNotFound):
        await delete_set(
            workout_id=1,
            workout_exercise_id=2,
            set_id=3,
            user_id=4,
            db_session=db_session,
        )


async def test_delete_set_workout_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_2.id)

    with pytest.raises(WorkoutNotFound):
        await delete_set(
            workout_id=workout.id,
            workout_exercise_id=2,
            set_id=3,
            user_id=user_1.id,
            db_session=db_session,
        )


async def test_delete_set_not_found(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    with pytest.raises(SetNotFound):
        await delete_set(
            workout_id=workout.id,
            workout_exercise_id=workout_exercise.id,
            set_id=3,
            user_id=user.id,
            db_session=db_session,
        )
