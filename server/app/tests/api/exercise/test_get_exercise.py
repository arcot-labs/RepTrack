import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import ExerciseNotFound
from app.models.schemas.exercise import ExercisePublic

from ..utilities import HttpMethod, login_admin, make_http_request
from .utilities import (
    create_exercise_via_api,
    create_system_exercise,
    patch_index_exercise,
)


async def _make_request(client: AsyncClient, exercise_id: int):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint=f"/api/exercises/{exercise_id}",
    )


# 200
async def test_get_exercise(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
):
    patch_index_exercise(monkeypatch)

    await login_admin(client, settings)
    created = await create_exercise_via_api(client, db_session, name="Bench Press")

    resp = await _make_request(client, created.id)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    ExercisePublic.model_validate(body)
    assert body["name"] == "Bench Press"


# 200
async def test_get_exercise_system_exercise(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    system_ex = await create_system_exercise(db_session, name="Deadlift")
    await login_admin(client, settings)

    resp = await _make_request(client, system_ex.id)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    ExercisePublic.model_validate(body)
    assert body["name"] == "Deadlift"
    assert body["user_id"] is None


# 401
async def test_get_exercise_not_logged_in(
    client: AsyncClient,
    db_session: AsyncSession,
):
    system_ex = await create_system_exercise(db_session, name="Pull-up")

    resp = await _make_request(client, system_ex.id)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_get_exercise_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client, 99999)

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail
