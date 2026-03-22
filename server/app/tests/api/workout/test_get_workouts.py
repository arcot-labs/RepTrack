from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.schemas.workout import WorkoutBase

from ..utilities import (
    HttpMethod,
    create_user,
    get_admin,
    login_admin,
    make_http_request,
)
from .utilities import create_workout


async def _make_request(client: AsyncClient):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint="/api/workouts",
    )


# 200
async def test_get_workouts(
    client: AsyncClient,
    session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    admin = await get_admin(session, settings)
    user = await create_user(session)

    admin_workout = await create_workout(session, user_id=admin.id)
    user_workout = await create_workout(session, user_id=user.id)

    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert isinstance(body, list)
    ids = [WorkoutBase.model_validate(w).id for w in body]  # pyright: ignore[reportUnknownVariableType]
    assert admin_workout.id in ids
    assert user_workout.id not in ids


# 401
async def test_get_workouts_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
