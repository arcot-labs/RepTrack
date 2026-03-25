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


async def test_get_token_registration(db_session: AsyncSession):
    access_request = await create_access_request(db_session, "token-user@example.com")
    token_str, _token = create_registration_token(access_request.id)
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.access_request.id == access_request.id


async def test_get_token_registration_invalid_token(
    db_session: AsyncSession,
):
    token = await _get_token(
        "invalid-token",
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )
    assert token is None


async def test_get_token_registration_used_token(
    db_session: AsyncSession,
):
    access_request = await create_access_request(db_session, "used@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.used_at = datetime.now(UTC)
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )
    assert token is None


async def test_get_token_registration_expired_token(
    db_session: AsyncSession,
):
    access_request = await create_access_request(db_session, "expired@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )
    assert token is None


async def test_get_token_registration_invalid_hash(
    db_session: AsyncSession,
):
    access_request = await create_access_request(db_session, "invalid-hash@example.com")
    token_str, _token = create_registration_token(access_request.id)
    _token.token_hash = PASSWORD_HASH.hash(token_str + "tampered")
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )
    assert token is None


async def test_get_registration_token(db_session: AsyncSession):
    access_request = await create_access_request(db_session, "registered@example.com")
    token_str, _token = create_registration_token(access_request.id)
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db_session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.access_request.id == access_request.id


async def test_get_password_reset_token(db_session: AsyncSession, settings: Settings):
    admin = await get_admin(db_session, settings)
    token_str, _token = create_password_reset_token(admin.id)
    db_session.add(_token)
    await db_session.commit()

    token = await _get_token(
        token_str,
        model=type(_token),
        load_option=PasswordResetToken.user,
        db=db_session,
    )

    assert token is not None
    assert token.id == _token.id
    assert token.user.id == admin.id
