from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_registration_token
from app.models.database.registration_token import RegistrationToken
from app.services.token import expire_tokens
from app.tests.core.security.utilities import create_access_request

# tests use RegistrationToken
# PasswordResetToken behavior is identical


async def test_expire_tokens_registration(
    session: AsyncSession,
):
    access_request = await create_access_request(session, "expire@example.com")
    _, active_token = create_registration_token(access_request.id)
    _, expired_token = create_registration_token(access_request.id)
    expired_token.expires_at = datetime.now(UTC) - timedelta(minutes=1)

    session.add_all([active_token, expired_token])
    await session.commit()

    previous_expired_value = expired_token.expires_at

    await expire_tokens(
        RegistrationToken,
        [RegistrationToken.access_request_id == access_request.id],
        session,
    )

    await session.refresh(active_token)
    await session.refresh(expired_token)

    assert active_token.expires_at <= datetime.now(UTC)
    assert expired_token.expires_at == previous_expired_value


async def test_expire_tokens_registration_condition(
    session: AsyncSession,
):
    target_request = await create_access_request(session, "target-expire@example.com")
    other_request = await create_access_request(session, "other-expire@example.com")

    _, target_token = create_registration_token(target_request.id)
    _, other_token = create_registration_token(other_request.id)

    session.add_all([target_token, other_token])
    await session.commit()

    await expire_tokens(
        RegistrationToken,
        [RegistrationToken.access_request_id == target_request.id],
        session,
    )

    await session.refresh(target_token)
    await session.refresh(other_token)

    now = datetime.now(UTC)
    assert target_token.expires_at <= now
    assert other_token.expires_at > now
