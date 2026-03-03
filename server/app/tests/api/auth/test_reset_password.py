from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_password_reset_token
from app.models.database.user import User
from app.models.errors import InvalidToken
from app.tests.api.utilities import HttpMethod, make_http_request


async def make_request(client: AsyncClient, *, token: str, password: str):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/auth/reset-password",
        json={
            "token": token,
            "password": password,
        },
    )


async def get_admin(session: AsyncSession, settings: Settings) -> User:
    result = await session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    return result.scalar_one()


# 204
async def test_reset_password(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    admin = await get_admin(session, settings)

    token_str, token = create_password_reset_token(admin.id)
    session.add(token)
    await session.commit()

    resp = await make_request(client, token=token_str, password="NewPassword123")

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 400
async def test_reset_password_invalid_token(client: AsyncClient):
    resp = await make_request(
        client,
        token="invalid_token",
        password="NewPassword123",
    )

    assert resp.status_code == InvalidToken.status_code
    body = resp.json()
    assert body["detail"] == InvalidToken.detail


# 422
async def test_reset_password_invalid_body(client: AsyncClient):
    resp = await make_request(
        client,
        token=None,  # type: ignore
        password="NewPassword123",
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "token"]
