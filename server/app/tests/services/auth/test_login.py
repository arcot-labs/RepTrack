import jwt
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.errors import InvalidCredentials
from app.services.auth import login


async def test_login(db_session: AsyncSession, settings: Settings):
    result = await login(
        identifier=settings.admin.username,
        password=settings.admin.password,
        db=db_session,
        settings=settings,
    )
    payload = jwt.decode(
        result.access_token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )

    assert payload["sub"] == settings.admin.username
    assert "exp" in payload


async def test_login_with_email(db_session: AsyncSession, settings: Settings):
    result = await login(
        identifier=settings.admin.email,
        password=settings.admin.password,
        db=db_session,
        settings=settings,
    )
    payload = jwt.decode(
        result.access_token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )

    assert payload["sub"] == settings.admin.username
    assert "exp" in payload


async def test_login_user_not_found(db_session: AsyncSession, settings: Settings):
    with pytest.raises(InvalidCredentials):
        await login(
            identifier="non_existent_user",
            password="some_password",
            db=db_session,
            settings=settings,
        )


async def test_login_invalid_password(db_session: AsyncSession, settings: Settings):
    with pytest.raises(InvalidCredentials):
        await login(
            identifier=settings.admin.username,
            password="some_password",
            db=db_session,
            settings=settings,
        )
