from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.core.security import ACCESS_JWT_KEY, REFRESH_JWT_KEY
from app.models.errors import InvalidCredentials
from app.tests.api.utilities import login, login_admin


# 204
async def test_login(client: AsyncClient, settings: Settings):
    resp = await login_admin(client, settings)

    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert ACCESS_JWT_KEY in resp.cookies
    assert REFRESH_JWT_KEY in resp.cookies


# 401
async def test_login_non_existent_user(client: AsyncClient):
    resp = await login(client, username="non_existent_user", password="some_password")

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail


# 401
async def test_login_invalid_password(client: AsyncClient, settings: Settings):
    resp = await login(
        client, username=settings.admin.username, password="some_password"
    )

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail


# 422
async def test_login_invalid_body(client: AsyncClient):
    resp = await login(client, username=None, password=None)  # type: ignore

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "username"]
    assert body["detail"][1]["loc"] == ["body", "password"]
