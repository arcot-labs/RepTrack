from typing import Any

from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import (
    ExerciseNameConflict,
    ExerciseNotFound,
    MuscleGroupNotFound,
)
from app.tests.api.exercises.utilities import (
    create_exercise_via_api,
    create_system_exercise,
    get_muscle_group_id,
)

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(
    client: AsyncClient,
    exercise_id: int,
    name: str | None = None,
    description: str | None = None,
    muscle_group_ids: list[int] | None = None,
):
    payload: dict[str, Any] = {}
    if name is not None:
        payload["name"] = name
    if description is not None:
        payload["description"] = description
    if muscle_group_ids is not None:
        payload["muscle_group_ids"] = muscle_group_ids

    return await make_http_request(
        client,
        method=HttpMethod.PATCH,
        endpoint=f"/api/exercises/{exercise_id}",
        json=payload,
    )


# 204
async def test_update_exercise(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    created = await create_exercise_via_api(client, session, name="Old Name")
    muscle_group_id = await get_muscle_group_id(session, name="chest")

    resp = await _make_request(
        client,
        created.id,
        name="New Name",
        description="Updated description",
        muscle_group_ids=[muscle_group_id],
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_update_exercise_not_logged_in(
    client: AsyncClient,
    session: AsyncSession,
):
    system_ex = await create_system_exercise(session, name="Anonymous Row")

    resp = await _make_request(client, system_ex.id, name="Renamed")

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# 403
async def test_update_exercise_not_allowed(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    system_ex = await create_system_exercise(session, name="System Row")

    resp = await _make_request(client, system_ex.id, name="Attempted Rename")

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail


# 404
async def test_update_exercise_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client, 99999, name="Unknown")

    assert resp.status_code == ExerciseNotFound.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNotFound.detail


# 404
async def test_update_exercise_muscle_group_not_found(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    created = await create_exercise_via_api(client, session, name="Flye")

    resp = await _make_request(client, created.id, muscle_group_ids=[99999])

    assert resp.status_code == MuscleGroupNotFound.status_code
    body = resp.json()
    assert body["detail"] == MuscleGroupNotFound.detail


# 409
async def test_update_exercise_name_conflict(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    await create_exercise_via_api(client, session, name="Taken Name")
    other = await create_exercise_via_api(client, session, name="To Rename")

    resp = await _make_request(client, other.id, name="Taken Name")

    assert resp.status_code == ExerciseNameConflict.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNameConflict.detail
