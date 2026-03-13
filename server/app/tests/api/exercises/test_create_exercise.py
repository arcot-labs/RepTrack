from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import ExerciseNameConflict, MuscleGroupNotFound
from app.models.schemas.exercise import ExercisePublic
from app.tests.api.exercises.utilities import get_muscle_group_id

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(
    client: AsyncClient,
    name: str,
    description: str | None = None,
    muscle_group_ids: list[int] | None = None,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/exercises",
        json={
            "name": name,
            "description": description,
            "muscle_group_ids": muscle_group_ids or [],
        },
    )


# 201
async def test_create_exercise(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)

    muscle_group_id = await get_muscle_group_id(session, name="chest")
    resp = await _make_request(
        client,
        name="Overhead Press",
        description="Pressing movement for shoulders",
        muscle_group_ids=[muscle_group_id],
    )

    assert resp.status_code == status.HTTP_201_CREATED

    body = resp.json()
    ExercisePublic.model_validate(body)
    assert body["name"] == "Overhead Press"
    assert body["description"] == "Pressing movement for shoulders"
    assert body["user_id"] is not None
    assert len(body["muscle_groups"]) == 1
    assert body["muscle_groups"][0]["id"] == muscle_group_id


# 401
async def test_create_exercise_not_logged_in(client: AsyncClient):
    resp = await _make_request(client, name="Push-up")

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 404
async def test_create_exercise_muscle_group_not_found(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client, name="Lateral Raise", muscle_group_ids=[99999])

    assert resp.status_code == MuscleGroupNotFound.status_code
    body = resp.json()
    assert body["detail"] == MuscleGroupNotFound.detail


# 409
async def test_create_exercise_name_conflict(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    await _make_request(client, name="Lunge")
    resp = await _make_request(client, name="Lunge")

    assert resp.status_code == ExerciseNameConflict.status_code
    body = resp.json()
    assert body["detail"] == ExerciseNameConflict.detail


# 422
async def test_create_exercise_invalid_body(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/exercises",
        json={"description": "No name provided"},
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
