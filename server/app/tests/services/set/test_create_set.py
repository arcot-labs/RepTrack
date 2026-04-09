from decimal import Decimal
from unittest.mock import patch

import pytest
from pytest import MonkeyPatch
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.models.enums import SetUnit
from app.models.errors import (
    SetNumberConflict,
    WorkoutExerciseNotFound,
    WorkoutNotFound,
)
from app.models.schemas.set import CreateSetRequest
from app.services.set import create_set

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout
from ..workout_exercise.utilities import create_workout_exercise
from .utilities import create_set as create_set_util


async def test_create_set(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    await create_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        user_id=user.id,
        req=CreateSetRequest(
            reps=10,
            weight=Decimal(100),
            unit=SetUnit.lb,
            notes="Test set",
        ),
        db_session=db_session,
    )

    result = await db_session.execute(
        select(Set).where(
            Set.workout_exercise_id == workout_exercise.id,
        )
    )
    set_ = result.scalar_one()

    assert set_.workout_exercise_id == workout_exercise.id
    assert set_.set_number == 1
    assert set_.reps == 10
    assert set_.weight == Decimal(100)
    assert set_.unit == "lb"
    assert set_.notes == "Test set"


async def test_create_set_workout_not_found(db_session: AsyncSession):
    with pytest.raises(WorkoutNotFound):
        await create_set(
            workout_id=1,
            workout_exercise_id=2,
            user_id=3,
            req=CreateSetRequest(),
            db_session=db_session,
        )


async def test_create_set_workout_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_2.id)

    with pytest.raises(WorkoutNotFound):
        await create_set(
            workout_id=workout.id,
            workout_exercise_id=2,
            user_id=user_1.id,
            req=CreateSetRequest(),
            db_session=db_session,
        )


async def test_create_set_workout_exercise_not_found(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)

    with pytest.raises(WorkoutExerciseNotFound):
        await create_set(
            workout_id=workout.id,
            workout_exercise_id=2,
            user_id=user.id,
            req=CreateSetRequest(),
            db_session=db_session,
        )


async def test_create_set_workout_exercise_not_allowed(db_session: AsyncSession):
    exercise = await create_exercise(db_session, name="Squat")

    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout_1 = await create_workout(db_session, user_id=user_1.id)
    workout_2 = await create_workout(db_session, user_id=user_2.id)
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout_2.id,
        exercise_id=exercise.id,
        position=1,
    )

    with pytest.raises(WorkoutExerciseNotFound):
        await create_set(
            workout_id=workout_1.id,
            workout_exercise_id=workout_exercise.id,
            user_id=user_1.id,
            req=CreateSetRequest(),
            db_session=db_session,
        )


async def test_create_set_set_number_conflict(
    db_session: AsyncSession,
    monkeypatch: MonkeyPatch,
):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    await create_set_util(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )

    async def mock_get_next_set_number(
        workout_exercise_id: int, db_session: AsyncSession
    ) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.set._get_next_set_number", mock_get_next_set_number
    )

    with pytest.raises(SetNumberConflict):
        await create_set(
            workout_id=workout.id,
            workout_exercise_id=workout_exercise.id,
            user_id=user.id,
            req=CreateSetRequest(),
            db_session=db_session,
        )


async def test_create_set_unhandled_integrity_error(
    db_session: AsyncSession,
    monkeypatch: MonkeyPatch,
):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    await create_set_util(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )

    async def mock_get_next_set_number(
        workout_exercise_id: int, db_session: AsyncSession
    ) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.set._get_next_set_number", mock_get_next_set_number
    )

    with patch("app.services.set.is_unique_violation", return_value=False):
        with pytest.raises(IntegrityError):
            await create_set(
                workout_id=workout.id,
                workout_exercise_id=workout_exercise.id,
                user_id=user.id,
                req=CreateSetRequest(),
                db_session=db_session,
            )
