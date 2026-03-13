from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    create_password_reset_token,
    create_registration_token,
    expire_existing_password_reset_tokens,
    expire_existing_registration_tokens,
)
from app.models.database.user import User
from app.tests.core.security.utilities import create_access_request

from ..utilities import get_admin


async def _create_user(session: AsyncSession, email: str, username: str) -> User:
    user = User(
        email=email,
        username=username,
        first_name="Test",
        last_name="User",
        password_hash="hash",
    )
    session.add(user)
    await session.flush()
    return user


async def test_expire_existing_registration_tokens(
    session: AsyncSession,
):
    target_request = await create_access_request(session, "wrapper-target@example.com")
    other_request = await create_access_request(session, "wrapper-other@example.com")

    _, target_token = create_registration_token(target_request.id)
    _, other_token = create_registration_token(other_request.id)

    session.add_all([target_token, other_token])
    await session.commit()

    await expire_existing_registration_tokens(target_request.id, session)

    await session.refresh(target_token)
    await session.refresh(other_token)

    now = datetime.now(UTC)
    assert target_token.expires_at <= now
    assert other_token.expires_at > now


async def test_expire_existing_password_reset_tokens(
    session: AsyncSession,
    settings: Settings,
):
    admin = await get_admin(session, settings)
    other_user = await _create_user(
        session,
        email="other-user@example.com",
        username="otheruser",
    )

    _, target_token = create_password_reset_token(admin.id)
    _, other_token = create_password_reset_token(other_user.id)

    session.add_all([target_token, other_token])
    await session.commit()

    await expire_existing_password_reset_tokens(admin.id, session)

    await session.refresh(target_token)
    await session.refresh(other_token)

    now = datetime.now(UTC)
    assert target_token.expires_at <= now
    assert other_token.expires_at > now
