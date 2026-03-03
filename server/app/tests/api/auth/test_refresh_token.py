from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.core.security import ACCESS_JWT_KEY, REFRESH_JWT_KEY
from app.models.errors import InvalidCredentials
from app.tests.api.utilities import HttpMethod, login_admin, make_http_request


async def make_request(client: AsyncClient):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/auth/refresh-token",
    )


# 204
async def test_refresh_token(client: AsyncClient, settings: Settings):
    await login_admin(client, settings)
    resp = await make_request(client)

    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert ACCESS_JWT_KEY in resp.cookies
    assert REFRESH_JWT_KEY not in resp.cookies


# 401
async def test_refresh_token_invalid_token(client: AsyncClient):
    client.cookies.set(REFRESH_JWT_KEY, "invalid_token")
    resp = await make_request(client)

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail
