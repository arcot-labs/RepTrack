from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.services.queries.user import select_user_by_username


async def test_select_user_by_username(db_session: AsyncSession):
    user = User(
        email="by-username@example.com",
        username="by_username",
        first_name="By",
        last_name="Username",
        password_hash="hash",
    )
    db_session.add(user)
    await db_session.commit()

    result = await select_user_by_username(db_session, "by_username")

    assert result is not None
    assert result.id == user.id
    assert result.email == "by-username@example.com"


async def test_select_user_by_username_not_found(db_session: AsyncSession):
    result = await select_user_by_username(db_session, "missing_username")

    assert result is None
