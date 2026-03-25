import jwt
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import create_refresh_jwt
from app.models.errors import InvalidCredentials
from app.services.auth import refresh


async def test_refresh(db_session: AsyncSession, settings: Settings):
    token = create_refresh_jwt(settings.admin.username, settings)
    new_access_token = await refresh(db_session, token, settings)

    payload = jwt.decode(
        new_access_token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    assert payload["sub"] == settings.admin.username
    assert "exp" in payload


async def test_refresh_user_not_found(db_session: AsyncSession, settings: Settings):
    token = create_refresh_jwt("missing_user", settings)

    with pytest.raises(InvalidCredentials):
        await refresh(db_session, token, settings)


async def test_refresh_invalid_token(db_session: AsyncSession, settings: Settings):
    with pytest.raises(InvalidCredentials):
        await refresh(db_session, "invalid-token", settings)
