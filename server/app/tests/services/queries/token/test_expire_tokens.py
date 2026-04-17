from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_registration_token
from app.models.database.registration_token import RegistrationToken
from app.services.queries.token import expire_tokens
from app.tests.core.security.utilities import create_access_request

# tests use RegistrationToken
# PasswordResetToken behavior is identical


async def test_expire_tokens_registration(
    db_session: AsyncSession,
):
    access_request = await create_access_request(db_session, "expire@example.com")
    _, active_token = create_registration_token(access_request.id)
    _, expired_token = create_registration_token(access_request.id)
    expired_token.expires_at = datetime.now(UTC) - timedelta(minutes=1)

    db_session.add_all([active_token, expired_token])
    await db_session.commit()

    previous_expired_value = expired_token.expires_at

    await expire_tokens(
        db_session,
        RegistrationToken,
        [RegistrationToken.access_request_id == access_request.id],
    )

    await db_session.refresh(active_token)
    await db_session.refresh(expired_token)

    assert active_token.expires_at <= datetime.now(UTC)
    assert expired_token.expires_at == previous_expired_value


async def test_expire_tokens_registration_condition(
    db_session: AsyncSession,
):
    target_request = await create_access_request(
        db_session, "target-expire@example.com"
    )
    other_request = await create_access_request(db_session, "other-expire@example.com")

    _, target_token = create_registration_token(target_request.id)
    _, other_token = create_registration_token(other_request.id)

    db_session.add_all([target_token, other_token])
    await db_session.commit()

    await expire_tokens(
        db_session,
        RegistrationToken,
        [RegistrationToken.access_request_id == target_request.id],
    )

    await db_session.refresh(target_token)
    await db_session.refresh(other_token)

    now = datetime.now(UTC)
    assert target_token.expires_at <= now
    assert other_token.expires_at > now
