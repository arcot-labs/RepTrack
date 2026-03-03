from datetime import datetime, timedelta, timezone

from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    _get_token,  # pyright: ignore[reportPrivateUsage]
    create_password_reset_token,
    create_registration_token,
)
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken
from app.models.database.user import User

# _get_token tests use RegistrationToken
# PasswordResetToken behavior is identical
# wrappers are tested separately

PASSWORD_HASH = PasswordHash.recommended()


async def get_admin(session: AsyncSession, settings: Settings) -> User:
    result = await session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    return result.scalar_one()


async def create_access_request(session: AsyncSession, email: str) -> AccessRequest:
    access_request = AccessRequest(
        email=email,
        first_name="Test",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()
    return access_request


async def test_get_token_registration_returns_token(session: AsyncSession):
    access_request = await create_access_request(session, "token-user@example.com")
    token_str, _token = create_registration_token(access_request.id)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.access_request.id == access_request.id


async def test_get_token_registration_returns_none_for_invalid_token(
    session: AsyncSession,
):
    token = await _get_token(
        "invalid-token",
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_returns_none_for_used_token(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "used@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.used_at = datetime.now(timezone.utc)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_returns_none_for_expired_token(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "expired@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_returns_none_for_invalid_hash(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "invalid-hash@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.token_hash = PASSWORD_HASH.hash(token_str + "tampered")
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_registration_token_returns_token(session: AsyncSession):
    access_request = await create_access_request(session, "registered@example.com")
    token_str, _token = create_registration_token(access_request.id)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.access_request.id == access_request.id


async def test_get_password_reset_token_returns_token(
    session: AsyncSession, settings: Settings
):
    admin = await get_admin(session, settings)
    token_str, _token = create_password_reset_token(admin.id)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=type(_token),
        load_option=PasswordResetToken.user,
        db=session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.user.id == admin.id
