from fastapi import status
from httpx import AsyncClient
from meilisearch_python_sdk.models.search import SearchResults

from app.core.config import Settings

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

    resp = await _make_request(client, query="chest", limit=5)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    results = SearchResults.model_validate(body)  # pyright: ignore[reportUnknownVariableType]

    assert results.query == "chest"
    assert results.limit == 5


# 401
async def test_search_muscle_groups_not_logged_in(client: AsyncClient):
    resp = await _make_request(client, "", 0)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
