from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import PASSWORD_HASH, create_password_reset_token
from app.models.database.user import User
from app.models.errors import InvalidToken
from app.services.auth import reset_password


async def test_reset_password(session: AsyncSession):
    user = User(
        email="reset2@example.com",
        username="reset_user2",
        first_name="Reset",
        last_name="User",
        password_hash=PASSWORD_HASH.hash("old_password"),
    )
    session.add(user)
    await session.flush()

    token_str, token = create_password_reset_token(user.id)
    session.add(token)
    await session.commit()

    assert not token.is_expired()

    old_hash = user.password_hash

    await reset_password(
        token_str=token_str,
        password="new_password",
        db=session,
    )

    assert user.password_hash != old_hash
    assert PASSWORD_HASH.verify("new_password", user.password_hash)

    await session.refresh(token)
    assert token.is_used()
    assert token.is_expired()


async def test_reset_password_invalid_token(session: AsyncSession):
    with pytest.raises(InvalidToken):
        await reset_password(
            token_str="invalid-token",
            password="new_password",
            db=session,
        )


async def test_reset_password_used_token(session: AsyncSession):
    user = User(
        email="reset@example.com",
        username="reset_user",
        first_name="Reset",
        last_name="User",
        password_hash=PASSWORD_HASH.hash("password"),
    )
    session.add(user)
    await session.flush()

    token_str, token = create_password_reset_token(user.id)
    token.used_at = datetime.now(UTC)
    session.add(token)
    await session.commit()

    with pytest.raises(InvalidToken):
        await reset_password(
            token_str=token_str,
            password="new_password",
            db=session,
        )


async def test_reset_password_expired_token(session: AsyncSession):
    user = User(
        email="expired@example.com",
        username="expired_user",
        first_name="Expired",
        last_name="User",
        password_hash=PASSWORD_HASH.hash("password"),
    )
    session.add(user)
    await session.flush()

    token_str, token = create_password_reset_token(user.id)
    token.expires_at = datetime.now(UTC)
    session.add(token)
    await session.commit()

    with pytest.raises(InvalidToken):
        await reset_password(
            token_str=token_str,
            password="new_password",
            db=session,
        )
