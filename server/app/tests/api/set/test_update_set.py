from decimal import Decimal

from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import SetNotFound, WorkoutNotFound
from app.tests.api.exercise.utilities import create_exercise
from app.tests.api.workout.utilities import create_workout
from app.tests.api.workout_exercise.utilities import create_workout_exercise
from app.tests.services.set.utilities import create_set

from ..utilities import (
    HttpMethod,
    get_admin,
    login_admin,
    make_http_request,
)


async def _make_request(
    client: AsyncClient,
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    reps: int | None = None,
    weight: Decimal | None = None,
    unit: str | None = None,
    notes: str | None = None,
):
    return await make_http_request(
        client,
        method=HttpMethod.PATCH,
        endpoint=f"/api/workouts/{workout_id}/exercises/{workout_exercise_id}/sets/{set_id}",
        json={
            "reps": reps,
            "weight": float(weight) if weight is not None else None,
            "unit": unit,
            "notes": notes,
        },
    )


# 204
async def test_update_set(
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
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        reps=10,
        weight=Decimal("100"),
        unit="lb",
        notes="Updated notes",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_update_set_not_logged_in(client: AsyncClient):
    resp = await _make_request(
        client,
        workout_id=1,
        workout_exercise_id=1,
        set_id=1,
    )

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_update_set_workout_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(
        client,
        workout_id=999,
        workout_exercise_id=1,
        set_id=1,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_update_set_not_found(
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
        set_id=999,
    )

    assert resp.status_code == SetNotFound.status_code
    body = resp.json()
    assert body["detail"] == SetNotFound.detail
