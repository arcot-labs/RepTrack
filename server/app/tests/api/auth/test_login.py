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


# 204
async def test_login_with_email(client: AsyncClient, settings: Settings):
    resp = await login(
        client,
        email=settings.admin.email,
        password=settings.admin.password,
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT
    assert ACCESS_JWT_KEY in resp.cookies
    assert REFRESH_JWT_KEY in resp.cookies


# 401
async def test_login_user_not_found(client: AsyncClient):
    resp = await login(
        client,
        username="non_existent_user",
        password="some_password",
    )

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail


# 401
async def test_login_invalid_password(client: AsyncClient, settings: Settings):
    resp = await login(
        client,
        username=settings.admin.username,
        password="some_password",
    )

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail


# 422
async def test_login_missing_identifier(client: AsyncClient, settings: Settings):
    resp = await login(
        client,
        password=settings.admin.password,
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert (
        "At least one of username or email must be provided" in body["detail"][0]["msg"]
    )


# 422
async def test_login_missing_password(client: AsyncClient):
    resp = await login(client)

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "password"]
