from fastapi import status
from httpx import AsyncClient
from pytest import MonkeyPatch
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import (
    ExerciseNotFound,
    WorkoutExercisePositionConflict,
    WorkoutNotFound,
)
from app.tests.api.exercise.utilities import create_exercise
from app.tests.api.workout.utilities import create_workout
from app.tests.api.workout_exercise.utilities import create_workout_exercise

from ..utilities import (
    HttpMethod,
    create_user,
    get_admin,
    login_admin,
    make_http_request,
)


async def _make_request(
    client: AsyncClient,
    workout_id: int,
    exercise_id: int,
    notes: str | None = None,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint=f"/api/workouts/{workout_id}/exercises",
        json={
            "exercise_id": exercise_id,
            "notes": notes,
        },
    )


# 204
async def test_create_workout_exercise(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    admin = await get_admin(db_session, settings)
    workout = await create_workout(db_session, user_id=admin.id)
    exercise = await create_exercise(db_session, name="Bench Press")

    resp = await _make_request(
        client,
        workout_id=workout.id,
        exercise_id=exercise.id,
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_create_workout_exercise_not_logged_in(client: AsyncClient):
    resp = await _make_request(
        client,
        workout_id=1,
        exercise_id=1,
    )

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_create_workout_exercise_workout_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(
        client,
        workout_id=999,
        exercise_id=999,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_create_workout_exercise_exercise_not_found(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    admin = await get_admin(db_session, settings)
    workout = await create_workout(db_session, user_id=admin.id)

    resp = await _make_request(
        client,
        workout_id=workout.id,
        exercise_id=999,
    )

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail


# 404
async def test_create_workout_exercise_workout_not_allowed(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    user = await create_user(db_session)

    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Squat")

    resp = await _make_request(
        client,
        workout_id=workout.id,
        exercise_id=exercise.id,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_create_workout_exercise_exercise_not_allowed(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    admin = await get_admin(db_session, settings)
    user = await create_user(db_session)

    workout = await create_workout(db_session, user_id=admin.id)
    exercise = await create_exercise(db_session, name="Deadlift", user_id=user.id)

    resp = await _make_request(
        client,
        workout_id=workout.id,
        exercise_id=exercise.id,
    )

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail


# 409
async def test_create_workout_exercise_position_conflict(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
    monkeypatch: MonkeyPatch,
):
    await login_admin(client, settings)

    admin = await get_admin(db_session, settings)
    workout = await create_workout(db_session, user_id=admin.id)
    exercise = await create_exercise(db_session, name="Row")

    await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    async def mock_select_next_position(
        db_session: AsyncSession,
        workout_id: int,
    ) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.workout_exercise.select_next_workout_exercise_position",
        mock_select_next_position,
    )

    resp = await _make_request(
        client,
        workout_id=workout.id,
        exercise_id=exercise.id,
    )

    assert resp.status_code == WorkoutExercisePositionConflict.status_code
    body = resp.json()
    assert body["detail"] == WorkoutExercisePositionConflict.detail
