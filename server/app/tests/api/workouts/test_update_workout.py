from datetime import datetime
from typing import Any

from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import WorkoutNotFound

from ..utilities import (
    HttpMethod,
    create_user,
    get_admin,
    login_admin,
    make_http_request,
)
from .utilities import create_workout


async def _make_request(
    client: AsyncClient,
    workout_id: int,
    notes: str | None = None,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
):
    payload: dict[str, Any] = {}
    if started_at is not None:
        payload["started_at"] = started_at.isoformat()
    if ended_at is not None:
        payload["ended_at"] = ended_at.isoformat()
    if notes is not None:
        payload["notes"] = notes

    return await make_http_request(
        client,
        method=HttpMethod.PATCH,
        endpoint=f"/api/workouts/{workout_id}",
        json=payload,
    )


# 204
async def test_update_workout(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    admin = await get_admin(session, settings)
    workout = await create_workout(session, user_id=admin.id)

    resp = await _make_request(
        client,
        workout.id,
        started_at=datetime.now(),
        ended_at=datetime.now(),
        notes="Updated notes",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_update_workout_not_logged_in(
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
async def test_update_workout_not_found(
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
async def test_update_workout_not_allowed(
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
