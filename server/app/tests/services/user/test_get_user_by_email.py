from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.user import get_user_by_email


async def test_get_user_by_email(db_session: AsyncSession):
    user = User(
        email="by-email@example.com",
        username="by_email",
        first_name="By",
        last_name="Email",
        password_hash="hash",
    )
    db_session.add(user)
    await db_session.commit()

    result = await get_user_by_email("by-email@example.com", db_session)

    assert result is not None
    assert result.id == user.id
    assert result.username == "by_email"


async def test_get_user_by_email_not_found(db_session: AsyncSession):
    result = await get_user_by_email("missing-email@example.com", db_session)

    assert result is None
