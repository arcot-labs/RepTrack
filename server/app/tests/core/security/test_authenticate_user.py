from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import authenticate_user


async def test_authenticate_user(session: AsyncSession, settings: Settings):
    user = await authenticate_user(
        username=settings.admin.username,
        password=settings.admin.password,
        db=session,
    )

    assert user is not None
    assert user.username == settings.admin.username


async def test_authenticate_user_non_existent_user(session: AsyncSession):
    user = await authenticate_user(
        username="non_existent_user",
        password="some_password",
        db=session,
    )

    assert user is None


async def test_authenticate_user_invalid_password(
    session: AsyncSession, settings: Settings
):
    user = await authenticate_user(
        username=settings.admin.username,
        password="some_password",
        db=session,
    )

    assert user is None
