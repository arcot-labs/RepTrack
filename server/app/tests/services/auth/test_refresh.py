import jwt
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_refresh_jwt
from app.models.errors import InvalidCredentials
from app.services.auth import refresh


async def test_refresh_returns_new_access_token(
    session: AsyncSession, settings: Settings
):
    token = create_refresh_jwt(settings.admin.username, settings)
    new_access_token = await refresh(session, token, settings)

    payload = jwt.decode(
        new_access_token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    assert payload["sub"] == settings.admin.username
    assert "exp" in payload


async def test_refresh_raises_when_user_not_found(
    session: AsyncSession, settings: Settings
):
    token = create_refresh_jwt("missing_user", settings)

    with pytest.raises(InvalidCredentials):
        await refresh(session, token, settings)


async def test_refresh_raises_when_token_invalid(
    session: AsyncSession, settings: Settings
):
    with pytest.raises(InvalidCredentials):
        await refresh(session, "invalid-token", settings)
