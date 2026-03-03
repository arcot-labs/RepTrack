from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_registration_token
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.errors import InvalidToken, UsernameAlreadyRegistered
from app.tests.api.utilities import HttpMethod, make_http_request


async def make_request(client: AsyncClient, token: str, username: str, password: str):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/auth/register",
        json={
            "token": token,
            "username": username,
            "password": password,
        },
    )


async def create_approved_request_with_token(session: AsyncSession) -> tuple[str, str]:
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.commit()

    token_str, token = create_registration_token(access_request.id)
    session.add(token)
    await session.commit()

    return access_request.email, token_str


# 204
async def test_register(client: AsyncClient, session: AsyncSession):
    _, token_str = await create_approved_request_with_token(session)

    resp = await make_request(
        client,
        token=token_str,
        username="newuser",
        password="Password123",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 400
async def test_register_invalid_token(client: AsyncClient):
    resp = await make_request(
        client,
        token="invalid_token",
        username="newuser",
        password="Password123",
    )

    assert resp.status_code == InvalidToken.status_code
    body = resp.json()
    assert body["detail"] == InvalidToken.detail


# 409
async def test_register_username_already_registered(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    _, token_str = await create_approved_request_with_token(session)

    resp = await make_request(
        client,
        token=token_str,
        username=settings.admin.username,
        password="Password123",
    )

    assert resp.status_code == UsernameAlreadyRegistered.status_code
    body = resp.json()
    assert body["detail"] == UsernameAlreadyRegistered.detail


# 422
async def test_register_invalid_body(client: AsyncClient):
    resp = await make_request(
        client,
        token="some_token",
        username="newuser",
        password=None,  # type: ignore
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "password"]
