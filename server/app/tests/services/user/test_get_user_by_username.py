from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_user_by_username


async def test_get_user_by_username(db_session: AsyncSession):
    user = User(
        email="by-username@example.com",
        username="by_username",
        first_name="By",
        last_name="Username",
        password_hash="hash",
    )
    db_session.add(user)
    await db_session.commit()

    result = await get_user_by_username("by_username", db_session)

    assert result is not None
    assert result.id == user.id
    assert result.email == "by-username@example.com"


async def test_get_user_by_username_not_found(db_session: AsyncSession):
    result = await get_user_by_username("missing_username", db_session)

    assert result is None
