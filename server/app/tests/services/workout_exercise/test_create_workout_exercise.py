from unittest.mock import patch

import pytest
from pytest import MonkeyPatch
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise
from app.models.errors import (
    ExerciseNotFound,
    WorkoutExercisePositionConflict,
    WorkoutNotFound,
)
from app.models.schemas.workout_exercise import CreateWorkoutExerciseRequest
from app.services.workout_exercise import create_workout_exercise

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout
from .utilities import create_workout_exercise as create_workout_exercise_util


async def test_create_workout_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Deadlift")

    await create_workout_exercise(
        workout.id,
        user.id,
        CreateWorkoutExerciseRequest(
            exercise_id=exercise.id,
            notes="Example exercise",
        ),
        db_session,
    )

    result = await db_session.execute(
        select(WorkoutExercise).where(
            WorkoutExercise.workout_id == workout.id,
            WorkoutExercise.exercise_id == exercise.id,
        )
    )
    workout_exercise = result.scalar_one()

    assert workout_exercise.position == 1
    assert workout_exercise.notes == "Example exercise"


async def test_create_workout_exercise_workout_not_found(db_session: AsyncSession):
    with pytest.raises(WorkoutNotFound):
        await create_workout_exercise(
            workout_id=1,
            user_id=2,
            req=CreateWorkoutExerciseRequest(exercise_id=3),
            db_session=db_session,
        )


async def test_create_workout_exercise_workout_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_2.id)
    exercise = await create_exercise(db_session, name="Squat")

    with pytest.raises(WorkoutNotFound):
        await create_workout_exercise(
            workout_id=workout.id,
            user_id=user_1.id,
            req=CreateWorkoutExerciseRequest(exercise_id=exercise.id),
            db_session=db_session,
        )


async def test_create_workout_exercise_exercise_not_found(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)

    with pytest.raises(ExerciseNotFound):
        await create_workout_exercise(
            workout_id=workout.id,
            user_id=user.id,
            req=CreateWorkoutExerciseRequest(exercise_id=99999),
            db_session=db_session,
        )


async def test_create_workout_exercise_exercise_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_1.id)
    exercise = await create_exercise(
        db_session,
        name="Owned by other",
        user_id=user_2.id,
    )

    with pytest.raises(ExerciseNotFound):
        await create_workout_exercise(
            workout.id,
            user_1.id,
            CreateWorkoutExerciseRequest(exercise_id=exercise.id),
            db_session,
        )


async def test_create_workout_exercise_position_conflict(
    db_session: AsyncSession,
    monkeypatch: MonkeyPatch,
):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Exercise 1")

    await create_workout_exercise_util(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    async def mock_get_next_position(workout_id: int, db_session: AsyncSession) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.workout_exercise._get_next_workout_exercise_position",
        mock_get_next_position,
    )

    with pytest.raises(WorkoutExercisePositionConflict):
        await create_workout_exercise(
            workout.id,
            user.id,
            CreateWorkoutExerciseRequest(exercise_id=exercise.id),
            db_session,
        )


async def test_create_workout_exercise_unhandled_integrity_error(
    db_session: AsyncSession,
    monkeypatch: MonkeyPatch,
):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Exercise 1")

    await create_workout_exercise_util(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    async def mock_get_next_position(workout_id: int, db_session: AsyncSession) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.workout_exercise._get_next_workout_exercise_position",
        mock_get_next_position,
    )

    with patch("app.services.workout_exercise.is_unique_violation", return_value=False):
        with pytest.raises(IntegrityError):
            await create_workout_exercise(
                workout.id,
                user.id,
                CreateWorkoutExerciseRequest(exercise_id=exercise.id),
                db_session,
            )
