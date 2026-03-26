from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import ExerciseNotFound
from app.tests.api.exercise.utilities import (
    create_exercise_via_api,
    create_system_exercise,
)

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(
    client: AsyncClient,
    exercise_id: int,
):
    return await make_http_request(
        client,
        method=HttpMethod.DELETE,
        endpoint=f"/api/exercises/{exercise_id}",
    )


# 204
async def test_delete_exercise(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    created = await create_exercise_via_api(client, db_session, name="Exercise")

    resp = await _make_request(client, created.id)

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_delete_exercise_not_logged_in(
    client: AsyncClient,
    db_session: AsyncSession,
):
    system_ex = await create_system_exercise(db_session, name="System Exercise")

    resp = await _make_request(client, system_ex.id)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_delete_exercise_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client, 99999)

    assert resp.status_code == ExerciseNotFound.status_code


# 404
async def test_delete_exercise_not_allowed(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    system_ex = await create_system_exercise(db_session, name="System Exercise")

    resp = await _make_request(client, system_ex.id)

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail
