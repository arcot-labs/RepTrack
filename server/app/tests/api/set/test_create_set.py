from fastapi import status
from httpx import AsyncClient
from pytest import MonkeyPatch
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.set import Set
from app.models.errors import (
    SetNumberConflict,
    WorkoutExerciseNotFound,
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
    workout_exercise_id: int,
    reps: int | None = None,
    weight: float | None = None,
    unit: str | None = None,
    notes: str | None = None,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint=f"/api/workouts/{workout_id}/exercises/{workout_exercise_id}/sets",
        json={
            "reps": reps,
            "weight": weight,
            "unit": unit,
            "notes": notes,
        },
    )


# 204
async def test_create_set(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    admin = await get_admin(db_session, settings)
    workout = await create_workout(db_session, user_id=admin.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        reps=10,
        weight=100,
        unit="lb",
        notes="Test notes",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_create_set_not_logged_in(client: AsyncClient):
    resp = await _make_request(
        client,
        workout_id=1,
        workout_exercise_id=1,
    )

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_create_set_workout_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(
        client,
        workout_id=999,
        workout_exercise_id=1,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_create_set_workout_not_allowed(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    user = await create_user(db_session)

    workout = await create_workout(db_session, user_id=user.id)

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=1,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_create_set_workout_exercise_not_found(
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
        workout_exercise_id=999,
    )

    assert resp.status_code == WorkoutExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutExerciseNotFound.detail


# 404
async def test_create_set_workout_exercise_not_allowed(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    admin = await get_admin(db_session, settings)
    user = await create_user(db_session)

    workout_1 = await create_workout(db_session, user_id=admin.id)
    workout_2 = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Squat")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout_2.id,
        exercise_id=exercise.id,
        position=1,
    )

    resp = await _make_request(
        client,
        workout_id=workout_1.id,
        workout_exercise_id=workout_exercise.id,
    )

    assert resp.status_code == WorkoutExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutExerciseNotFound.detail


# 409
async def test_create_set_number_conflict(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
    monkeypatch: MonkeyPatch,
):
    await login_admin(client, settings)

    admin = await get_admin(db_session, settings)
    workout = await create_workout(db_session, user_id=admin.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    existing = Set(
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )
    db_session.add(existing)
    await db_session.commit()

    async def mock_get_next_set_number(
        workout_exercise_id: int, db_session: AsyncSession
    ) -> int:
        return 1

    monkeypatch.setattr(
        "app.services.set._get_next_set_number", mock_get_next_set_number
    )

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        reps=5,
        weight=100,
        unit="lb",
    )

    assert resp.status_code == SetNumberConflict.status_code
    body = resp.json()
    assert body["detail"] == SetNumberConflict.detail
