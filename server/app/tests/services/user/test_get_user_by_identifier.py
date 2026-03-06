from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_user_by_identifier


async def test_get_user_by_identifier(session: AsyncSession):
    user = User(
        email="by-username@example.com",
        username="by_username",
        first_name="By",
        last_name="Username",
        password_hash="hash",
    )
    session.add(user)
    await session.commit()

    result = await get_user_by_identifier("by_username", session)

    assert result is not None
    assert result.id == user.id
    assert result.email == "by-username@example.com"


async def test_get_user_by_identifier_with_email(session: AsyncSession):
    user = User(
        email="by-email@example.com",
        username="by_email",
        first_name="By",
        last_name="Email",
        password_hash="hash",
    )
    session.add(user)
    await session.commit()

    result = await get_user_by_identifier("by-email@example.com", session)

    assert result is not None
    assert result.id == user.id
    assert result.username == "by_email"


async def test_get_user_by_identifier_not_found(session: AsyncSession):
    result = await get_user_by_identifier("missing_username", session)

    assert result is None
