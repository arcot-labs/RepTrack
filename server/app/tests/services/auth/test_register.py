from datetime import UTC, datetime

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import PASSWORD_HASH, create_registration_token
from app.models.database.access_request import AccessRequest
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.models.errors import InvalidToken, UsernameTaken
from app.services.auth import register


async def test_register(db_session: AsyncSession):
    access_request = AccessRequest(
        email="approved2@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    db_session.add(token)
    await db_session.commit()

    await register(
        token_str=token_str,
        username="new_user",
        password="new_password",
        db=db_session,
    )

    user = (
        await db_session.execute(select(User).where(User.username == "new_user"))
    ).scalar_one()
    assert user.email == access_request.email
    assert user.first_name == access_request.first_name
    assert user.last_name == access_request.last_name
    assert PASSWORD_HASH.verify("new_password", user.password_hash)

    await db_session.refresh(token)
    assert token.is_used()
    assert token.is_expired()


async def test_register_invalid_token(db_session: AsyncSession):
    with pytest.raises(InvalidToken):
        await register(
            token_str="invalid-token",
            username="new_user",
            password="new_password",
            db=db_session,
        )


async def test_register_used_token(db_session: AsyncSession):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    token.used_at = datetime.now(UTC)
    db_session.add(token)
    await db_session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="new_user",
            password="new_password",
            db=db_session,
        )


async def test_register_expired_token(db_session: AsyncSession):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    token.expires_at = datetime.now(UTC)
    db_session.add(token)
    await db_session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="new_user",
            password="new_password",
            db=db_session,
        )


async def test_register_access_request_not_approved(db_session: AsyncSession):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    db_session.add(token)
    await db_session.commit()

    with pytest.raises(InvalidToken):
        await register(
            token_str=token_str,
            username="pending_user",
            password="new_password",
            db=db_session,
        )


async def test_register_username_taken(db_session: AsyncSession):
    db_session.add(
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
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    db_session.add(token)
    await db_session.commit()

    with pytest.raises(UsernameTaken):
        await register(
            token_str=token_str,
            username="taken",
            password="new_password",
            db=db_session,
        )


async def test_register_username_matches_email(db_session: AsyncSession):
    collision_identifier = "identifier_collision"
    db_session.add(
        User(
            email=collision_identifier,
            username="existing_user",
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
    db_session.add(access_request)
    await db_session.flush()

    token_str, token = create_registration_token(access_request.id)
    db_session.add(token)
    await db_session.commit()

    with pytest.raises(UsernameTaken):
        await register(
            token_str=token_str,
            username=collision_identifier,
            password="new_password",
            db=db_session,
        )
