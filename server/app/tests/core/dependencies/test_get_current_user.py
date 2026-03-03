import time
from typing import Any

import jwt
import pytest
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.dependencies import get_current_user
from app.models.database.user import User
from app.models.errors import InvalidCredentials


def make_token(payload: dict[str, Any], secret: str, algorithm: str) -> str:
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return str(token)


async def test_get_current_user(session: AsyncSession, settings: Settings):
    token = make_token(
        {"sub": settings.admin.username},
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )
    user = await get_current_user(token=token, db=session, settings=settings)

    assert user.username == settings.admin.username
    assert user.email == settings.admin.email
    assert user.first_name == settings.admin.first_name
    assert user.last_name == settings.admin.last_name
    assert user.is_admin is True


async def test_get_current_user_missing_sub(session: AsyncSession, settings: Settings):
    token = make_token(
        {}, secret=settings.jwt.secret_key, algorithm=settings.jwt.algorithm
    )

    with pytest.raises(InvalidCredentials):
        await get_current_user(token=token, db=session, settings=settings)


async def test_get_current_user_invalid_secret(
    session: AsyncSession, settings: Settings
):
    token = make_token(
        {"sub": settings.admin.username},
        secret="this-is-the-wrong-jwt-secret-key",
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        await get_current_user(token=token, db=session, settings=settings)


async def test_get_current_user_expired_token(
    session: AsyncSession, settings: Settings
):
    past_time = int(time.time()) - 3600
    token = make_token(
        {"sub": settings.admin.username, "exp": past_time},
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        await get_current_user(token=token, db=session, settings=settings)


async def test_get_current_user_deleted_user(session: AsyncSession, settings: Settings):
    token = make_token(
        {"sub": settings.admin.username},
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    await session.execute(delete(User).where(User.username == settings.admin.username))
    await session.commit()

    with pytest.raises(InvalidCredentials):
        await get_current_user(token=token, db=session, settings=settings)
