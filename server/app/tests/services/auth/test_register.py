from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import PASSWORD_HASH, create_registration_token
from app.models.database.access_request import AccessRequest
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.models.errors import InvalidToken, UsernameAlreadyRegistered
from app.services.auth import register


async def test_register_creates_user_and_updates_token(session: AsyncSession):
    access_request = AccessRequest(
        email="approved2@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()

    token_str, token = create_registration_token(access_request.id)
    session.add(token)
    await session.commit()

    await register(
        token_str=token_str,
        username="new_user",
        password="new_password",
        db=session,
    )

    user = (
        await session.execute(select(User).where(User.username == "new_user"))
    ).scalar_one()
    assert user.email == access_request.email
    assert user.first_name == access_request.first_name
    assert user.last_name == access_request.last_name
    assert PASSWORD_HASH.verify("new_password", user.password_hash)

    await session.refresh(token)
    assert token.is_used()
    assert token.is_expired()


async def test_register_raises_for_invalid_token(session: AsyncSession):
    with pytest.raises(InvalidToken):
        await register(
            token_str="invalid-token",
            username="new_user",
            password="new_password",
            db=session,
        )


async def test_register_raises_for_used_token(session: AsyncSession):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()

    token_str, token = create_registration_token(access_request.id)
    token.used_at = datetime.now(UTC)
    session.add(token)
    await session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="new_user",
            password="new_password",
            db=session,
        )


async def test_register_raises_for_expired_token(session: AsyncSession):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()

    token_str, token = create_registration_token(access_request.id)
    token.expires_at = datetime.now(UTC)
    session.add(token)
    await session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="new_user",
            password="new_password",
            db=session,
        )


async def test_register_raises_when_access_request_not_approved(session: AsyncSession):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    session.add(access_request)
    await session.flush()

    token_str, token = create_registration_token(access_request.id)
    session.add(token)
    await session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="pending_user",
            password="new_password",
            db=session,
        )


async def test_register_raises_when_username_already_exists(session: AsyncSession):
    session.add(
        User(
            email="existing@example.com",
            username="taken",
            first_name="Existing",
            last_name="User",
            password_hash=PASSWORD_HASH.hash("password"),
        )
    )

    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()

    token_str, token = create_registration_token(access_request.id)
    session.add(token)
    await session.commit()

    with pytest.raises(UsernameAlreadyRegistered):
        await register(
            token_str=token_str,
            username="taken",
            password="new_password",
            db=session,
        )
