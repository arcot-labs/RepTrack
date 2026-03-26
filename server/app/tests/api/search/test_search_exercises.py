from fastapi import status
from httpx import AsyncClient

from ..utilities import HttpMethod, make_http_request


async def _make_request(
    client: AsyncClient,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/search/exercises",
    )


# 200
# TODO


# 401
async def test_search_exercises_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
