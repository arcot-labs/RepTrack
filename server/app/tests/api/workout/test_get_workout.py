from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import WorkoutNotFound
from app.models.schemas.workout import WorkoutBase

from ..utilities import (
    HttpMethod,
    create_user,
    get_admin,
    login_admin,
    make_http_request,
)
from .utilities import create_workout


async def _make_request(client: AsyncClient, workout_id: int):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint=f"/api/workouts/{workout_id}",
    )


# 200
async def test_get_workout(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    admin = await get_admin(session, settings)

    workout = await create_workout(session, user_id=admin.id)

    resp = await _make_request(client, workout.id)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    workout = WorkoutBase.model_validate(body)  # pyright: ignore[reportUnknownVariableType]
    assert workout.id == workout.id
    assert workout.user_id == admin.id


# 401
async def test_get_workout_not_logged_in(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    admin = await get_admin(session, settings)
    workout = await create_workout(session, user_id=admin.id)

    resp = await _make_request(client, workout.id)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_get_workout_not_found(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client, workout_id=9999)

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail


# 404
async def test_get_workout_not_allowed(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    user = await create_user(session)

    workout = await create_workout(session, user_id=user.id)

    resp = await _make_request(client, workout.id)

    assert resp.status_code == WorkoutNotFound.status_code
    body = resp.json()
    assert body["detail"] == WorkoutNotFound.detail
