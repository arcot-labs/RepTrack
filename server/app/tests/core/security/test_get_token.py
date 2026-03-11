from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    PASSWORD_HASH,
    _get_token,  # pyright: ignore[reportPrivateUsage]
    create_password_reset_token,
    create_registration_token,
)
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken
from app.tests.core.security.utilities import create_access_request

from ..utilities import get_admin

# _get_token tests use RegistrationToken
# PasswordResetToken behavior is identical
# wrappers are tested separately


async def test_get_token_registration(session: AsyncSession):
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


async def test_get_token_registration_invalid_token(
    session: AsyncSession,
):
    token = await _get_token(
        "invalid-token",
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_used_token(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "used@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.used_at = datetime.now(UTC)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_expired_token(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "expired@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    session.add(_token)
    await session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=session,
    )
    assert token is None


async def test_get_token_registration_invalid_hash(
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


async def test_get_registration_token(session: AsyncSession):
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


async def test_get_password_reset_token(session: AsyncSession, settings: Settings):
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
