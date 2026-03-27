from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import authenticate_user


async def test_authenticate_user(db_session: AsyncSession, settings: Settings):
    user = await authenticate_user(
        identifier=settings.admin.username,
        password=settings.admin.password,
        db_session=db_session,
    )

    assert user is not None
    assert user.username == settings.admin.username


async def test_authenticate_user_with_email(
    db_session: AsyncSession,
    settings: Settings,
):
    user = await authenticate_user(
        identifier=settings.admin.email,
        password=settings.admin.password,
        db_session=db_session,
    )

    assert user is not None
    assert user.email == settings.admin.email


async def test_authenticate_user_not_found(db_session: AsyncSession):
    user = await authenticate_user(
        identifier="non_existent_user",
        password="some_password",
        db_session=db_session,
    )

    assert user is None


async def test_authenticate_user_invalid_password(
    db_session: AsyncSession, settings: Settings
):
    user = await authenticate_user(
        identifier=settings.admin.username,
        password="some_password",
        db_session=db_session,
    )

    assert user is None
