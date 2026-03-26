from fastapi import status
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.user import User
from app.models.errors import InsufficientPermissions
from app.models.schemas.user import UserPublic

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(client: AsyncClient):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint="/api/users",
    )


# 200
async def test_get_users(client: AsyncClient, settings: Settings):
    await login_admin(client, settings)
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert isinstance(body, list)
    for item in body:  # type: ignore
        UserPublic.model_validate(item)

    usernames = {item["username"] for item in body}  # type: ignore
    assert settings.admin.username in usernames


# 401
async def test_get_users_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 403
async def test_get_users_non_admin_user(
    client: AsyncClient, db_session: AsyncSession, settings: Settings
):
    await db_session.execute(
        update(User)
        .where(User.username == settings.admin.username)
        .values(is_admin=False)
    )
    await db_session.commit()

    await login_admin(client, settings)
    resp = await _make_request(client)

    assert resp.status_code == InsufficientPermissions.status_code
    body = resp.json()
    assert body["detail"] == InsufficientPermissions.detail
