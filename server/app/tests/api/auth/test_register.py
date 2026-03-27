from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_registration_token
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.user import User
from app.models.errors import InvalidToken, UsernameTaken

from ..utilities import HttpMethod, make_http_request


async def _make_request(client: AsyncClient, token: str, username: str, password: str):
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


async def _create_approved_request_with_token(
    db_session: AsyncSession,
) -> tuple[str, str]:
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.commit()

    token_str, token = create_registration_token(access_request.id)
    db_session.add(token)
    await db_session.commit()

    return access_request.email, token_str


# 204
async def test_register(client: AsyncClient, db_session: AsyncSession):
    _, token_str = await _create_approved_request_with_token(db_session)

    resp = await _make_request(
        client,
        token=token_str,
        username="newuser",
        password="Password123",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 400
async def test_register_invalid_token(client: AsyncClient):
    resp = await _make_request(
        client,
        token="invalid_token",
        username="newuser",
        password="Password123",
    )

    assert resp.status_code == InvalidToken.status_code
    body = resp.json()
    assert body["detail"] == InvalidToken.detail


# 409
async def test_register_username_taken(
    client: AsyncClient, db_session: AsyncSession, settings: Settings
):
    _, token_str = await _create_approved_request_with_token(db_session)

    resp = await _make_request(
        client,
        token=token_str,
        username=settings.admin.username,
        password="Password123",
    )

    assert resp.status_code == UsernameTaken.status_code
    body = resp.json()
    assert body["detail"] == UsernameTaken.detail


# 409
async def test_register_username_matches_email(
    client: AsyncClient,
    db_session: AsyncSession,
):
    collision_identifier = "identifier_collision"
    db_session.add(
        User(
            email=collision_identifier,
            username="existing_user",
            first_name="Existing",
            last_name="User",
            password_hash="hash",
            is_admin=False,
        )
    )
    await db_session.commit()

    _, token_str = await _create_approved_request_with_token(db_session)
    resp = await _make_request(
        client,
        token=token_str,
        username=collision_identifier,
        password="Password123",
    )

    assert resp.status_code == UsernameTaken.status_code
    body = resp.json()
    assert body["detail"] == UsernameTaken.detail


# 422
async def test_register_invalid_body(client: AsyncClient):
    resp = await _make_request(
        client,
        token="some_token",
        username="newuser",
        password=None,  # type: ignore
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "password"]


# 422
async def test_register_username_is_email(client: AsyncClient):
    resp = await _make_request(
        client,
        token="some_token",
        username="user@example.com",
        password="Password123",
    )

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "username"]
    assert "Username cannot be an email address" in body["detail"][0]["msg"]
