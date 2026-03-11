from fastapi import status
from httpx import AsyncClient

from ..utilities import HttpMethod, make_http_request


# 200
async def test_get_health(client: AsyncClient):
    resp = await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint="/api/health",
    )

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body == "ok"
