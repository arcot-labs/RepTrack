from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import WorkoutExerciseNotFound, WorkoutNotFound
from app.tests.api.exercise.utilities import create_exercise
from app.tests.api.workout.utilities import create_workout

from ..utilities import (
    HttpMethod,
    create_user,
    get_admin,
    login_admin,
    make_http_request,
)
from .utilities import create_workout_exercise


async def _make_request(
    client: AsyncClient,
    workout_id: int,
    workout_exercise_id: int,
):
    return await make_http_request(
        client,
        method=HttpMethod.DELETE,
        endpoint=f"/api/workout-exercises/{workout_id}/exercises/{workout_exercise_id}",
    )


# 204
async def test_delete_workout_exercise(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    admin = await get_admin(session, settings)
    workout = await create_workout(session, user_id=admin.id)
    exercise = await create_exercise(session, name="Pull-up")
    workout_exercise = await create_workout_exercise(
        session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_delete_workout_exercise_not_logged_in(
    client: AsyncClient,
):
    resp = await _make_request(
        client,
        workout_id=1,
        workout_exercise_id=1,
    )

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_delete_workout_exercise_workout_not_found(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(
        client,
        workout_id=1,
        workout_exercise_id=1,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_delete_workout_exercise_not_found(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    admin = await get_admin(session, settings)
    workout = await create_workout(session, user_id=admin.id)

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=99999,
    )

    assert resp.status_code == WorkoutExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutExerciseNotFound.detail


# 404
async def test_delete_workout_exercise_workout_not_allowed(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    user = await create_user(session)

    workout = await create_workout(session, user_id=user.id)

    resp = await _make_request(
        client,
        workout_id=workout.id,
        workout_exercise_id=1,
    )

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail
