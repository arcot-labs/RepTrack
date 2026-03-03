from fastapi import status
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import ACCESS_JWT_KEY
from app.models.database.user import User
from app.models.errors import InvalidCredentials
from app.models.schemas.user import UserPublic
from app.tests.api.utilities import HttpMethod, login_admin, make_http_request


async def make_request(client: AsyncClient):
    return await make_http_request(
        client, method=HttpMethod.GET, endpoint="/api/users/current"
    )


# 200
async def test_get_current_user(client: AsyncClient, settings: Settings):
    await login_admin(client, settings)
    resp = await make_request(client)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    UserPublic.model_validate(body)
    assert body["username"] == settings.admin.username
    assert body["email"] == settings.admin.email
    assert body["is_admin"] is True


# 401
async def test_get_current_user_not_logged_in(client: AsyncClient):
    resp = await make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 401
async def test_get_current_user_invalid_cookie(client: AsyncClient, settings: Settings):
    await login_admin(client, settings)
    client.cookies.set(ACCESS_JWT_KEY, "invalid_token")
    resp = await make_request(client)

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail


# 401
async def test_get_current_user_deleted_user(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    await login_admin(client, settings)

    await session.execute(delete(User).where(User.username == settings.admin.username))
    await session.commit()

    resp = await make_request(client)

    assert resp.status_code == InvalidCredentials.status_code
    body = resp.json()
    assert body["detail"] == InvalidCredentials.detail
