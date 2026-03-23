from unittest.mock import patch

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.errors import ExerciseNameConflict, MuscleGroupNotFound
from app.models.schemas.exercise import CreateExerciseRequest
from app.services.exercise import create_exercise
from app.services.utilities.queries import query_exercises

from ..muscle_group.utilities import get_muscle_group_id
from ..utilities import create_user


async def test_create_exercise(session: AsyncSession):
    user = await create_user(session)
    muscle_group_id = await get_muscle_group_id(session, name="chest")

    await create_exercise(
        user.id,
        CreateExerciseRequest(
            name="Incline Bench",
            description="Upper chest press",
            muscle_group_ids=[muscle_group_id],
        ),
        session,
    )

    exercises = await query_exercises(
        session,
        False,
        Exercise.name == "Incline Bench",
    )
    exercise = exercises[0] if exercises else None

    assert exercise is not None
    assert exercise.user_id == user.id
    assert exercise.name == "Incline Bench"
    assert exercise.description == "Upper chest press"
    assert [mg.muscle_group_id for mg in exercise.muscle_groups] == [muscle_group_id]


async def test_create_exercise_muscle_group_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(MuscleGroupNotFound):
        await create_exercise(
            user.id,
            CreateExerciseRequest(name="Bench", muscle_group_ids=[99999]),
            session,
        )


async def test_create_exercise_name_conflict(session: AsyncSession):
    user = await create_user(session)
    await create_exercise(
        user.id,
        CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
        session,
    )

    with pytest.raises(ExerciseNameConflict):
        await create_exercise(
            user.id,
            CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
            session,
        )


async def test_create_exercise_unhandled_integrity_error(session: AsyncSession):
    user = await create_user(session)
    await create_exercise(
        user.id,
        CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
        session,
    )

    with patch("app.services.exercise.is_unique_violation", return_value=False):
        with pytest.raises(IntegrityError):
            await create_exercise(
                user.id,
                CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
                session,
            )
