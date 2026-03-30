from unittest.mock import patch

import pytest
from meilisearch_python_sdk import AsyncClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import (
    ExerciseNameConflict,
    ExerciseNotFound,
    MuscleGroupNotFound,
)
from app.models.schemas.exercise import UpdateExerciseRequest
from app.services.exercise import get_exercise, update_exercise

from ..muscle_group.utilities import get_muscle_group_id
from ..utilities import create_user
from .utilities import create_exercise, patch_index_exercise


async def test_update_exercise(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    mocked_index_exercise = patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )
    muscle_group_id = await get_muscle_group_id(db_session, name="chest")

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(
            name="Incline Bench",
            description="Updated description",
            muscle_group_ids=[muscle_group_id],
        ),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Incline Bench"
    assert exercise.description == "Updated description"
    assert [muscle_group.id for muscle_group in exercise.muscle_groups] == [
        muscle_group_id
    ]

    mocked_index_exercise.assert_awaited_once()


async def test_update_exercise_not_found(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    user = await create_user(db_session)

    with pytest.raises(ExerciseNotFound):
        await update_exercise(
            99999,
            user.id,
            UpdateExerciseRequest(),
            db_session,
            ms_client,
        )


async def test_update_exercise_not_allowed(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")

    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNotFound):
        await update_exercise(
            exercise.id,
            user_2.id,
            UpdateExerciseRequest(),
            db_session,
            ms_client,
        )


async def test_update_exercise_no_changes(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_no_name(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(description="Updated description"),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Bench"
    assert exercise.description == "Updated description"
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_no_description(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(name="Incline Bench"),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Incline Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_only_muscle_groups(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )
    original_updated_at = exercise.updated_at
    muscle_group_id = await get_muscle_group_id(db_session, name="chest")

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(muscle_group_ids=[muscle_group_id]),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Bench"
    assert exercise.description is None
    assert [muscle_group.id for muscle_group in exercise.muscle_groups] == [
        muscle_group_id
    ]
    assert exercise.updated_at > original_updated_at


async def test_update_exercise_null_values(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
        description="Initial description",
    )

    await update_exercise(
        exercise.id,
        user.id,
        UpdateExerciseRequest(description=None),
        db_session,
        ms_client,
    )

    exercise = await get_exercise(exercise.id, user.id, db_session)

    assert exercise.name == "Bench"
    assert exercise.description is None
    assert len(exercise.muscle_groups) == 0


async def test_update_exercise_muscle_group_not_found(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    user = await create_user(db_session)
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(MuscleGroupNotFound):
        await update_exercise(
            exercise.id,
            user.id,
            UpdateExerciseRequest(muscle_group_ids=[99999]),
            db_session,
            ms_client,
        )


async def test_update_exercise_name_conflict(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )
    exercise = await create_exercise(
        db_session,
        name="Press",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNameConflict):
        await update_exercise(
            exercise.id,
            user.id,
            UpdateExerciseRequest(name="bench"),
            db_session,
            ms_client,
        )


async def test_update_exercise_unhandled_integrity_error(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    user = await create_user(db_session)
    await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )
    exercise = await create_exercise(
        db_session,
        name="Press",
        user_id=user.id,
    )

    with patch("app.services.exercise.is_unique_violation", return_value=False):
        with pytest.raises(IntegrityError):
            await update_exercise(
                exercise.id,
                user.id,
                UpdateExerciseRequest(name="Bench"),
                db_session,
                ms_client,
            )
