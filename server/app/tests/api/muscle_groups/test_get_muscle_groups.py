from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.models.schemas.muscle_group import MuscleGroupPublic

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(client: AsyncClient):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint="/api/muscle-groups",
    )


# 200
async def test_get_muscle_groups(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    for muscle_group in body:
        MuscleGroupPublic.model_validate(muscle_group)


# 401
async def test_get_muscle_groups_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
