from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.models.schemas.muscle_group import MuscleGroupSearchResult
from app.tests.api.search.utilities import reindex_via_api

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(
    client: AsyncClient,
    query: str,
    limit: int,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/search/muscle-groups",
        json={
            "query": query,
            "limit": limit,
        },
    )


# 200
async def test_search_muscle_groups(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await reindex_via_api(client)
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    resp = await _make_request(client, query=".", limit=5)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert isinstance(body, list)

    assert len(body) == 5  # pyright: ignore[reportUnknownArgumentType]
    for result in body:  # pyright: ignore[reportUnknownVariableType]
        MuscleGroupSearchResult.model_validate(result)


# 401
async def test_search_muscle_groups_not_logged_in(client: AsyncClient):
    resp = await _make_request(client, "", 0)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
