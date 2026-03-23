from unittest.mock import patch

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import (
    ExerciseNameConflict,
    ExerciseNotFound,
    MuscleGroupNotFound,
)
from app.models.schemas.exercise import UpdateExerciseRequest
from app.services.exercise import get_exercise, update_exercise

from ..utilities import create_user
from .utilities import create_exercise, get_muscle_group_id


async def test_update_exercise(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )
    muscle_group_id = await get_muscle_group_id(session, name="chest")

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(
            name="Incline Bench",
            description="Updated description",
            muscle_group_ids=[muscle_group_id],
        ),
        session,
    )

    exercise = await get_exercise(exercise.id, user.id, session)

    assert exercise.name == "Incline Bench"
    assert exercise.description == "Updated description"
    assert [muscle_group.id for muscle_group in exercise.muscle_groups] == [
        muscle_group_id
    ]


async def test_update_exercise_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(ExerciseNotFound):
        await update_exercise(
            99999,
            user.id,
            UpdateExerciseRequest(),
            session,
        )


async def test_update_exercise_not_allowed(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")

    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNotFound):
        await update_exercise(
            exercise.id,
            user_2.id,
            UpdateExerciseRequest(),
            session,
        )


async def test_update_exercise_no_changes(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(),
        session,
    )

    exercise = await get_exercise(exercise.id, user.id, session)

    assert exercise.name == "Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_no_name(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(description="Updated description"),
        session,
    )

    exercise = await get_exercise(exercise.id, user.id, session)

    assert exercise.name == "Bench"
    assert exercise.description == "Updated description"
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_no_description(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(name="Incline Bench"),
        session,
    )

    exercise = await get_exercise(exercise.id, user.id, session)

    assert exercise.name == "Incline Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_null_values(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
        description="Initial description",
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(description=None),
        session,
    )

    exercise = await get_exercise(exercise.id, user.id, session)

    assert exercise.name == "Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_muscle_group_not_found(session: AsyncSession):
    user = await create_user(session)
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(MuscleGroupNotFound):
        await update_exercise(
            exercise.id,
            user.id,
            UpdateExerciseRequest(muscle_group_ids=[99999]),
            session,
        )


async def test_update_exercise_name_conflict(session: AsyncSession):
    user = await create_user(session)
    await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )
    exercise = await create_exercise(
        session,
        name="Press",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNameConflict):
        await update_exercise(
            exercise.id,
            user.id,
            UpdateExerciseRequest(name="Bench"),
            session,
        )


async def test_update_exercise_unhandled_integrity_error(session: AsyncSession):
    user = await create_user(session)
    await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )
    exercise = await create_exercise(
        session,
        name="Press",
        user_id=user.id,
    )

    with patch("app.services.exercise.is_unique_violation", return_value=False):
        with pytest.raises(IntegrityError):
            await update_exercise(
                exercise.id,
                user.id,
                UpdateExerciseRequest(name="Bench"),
                session,
            )
