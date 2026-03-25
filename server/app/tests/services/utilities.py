from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.user import User
from app.models.schemas.user import UserPublic
from app.services.utilities.serializers import to_user_public


async def get_admin_user_public(
    db_session: AsyncSession, settings: Settings
) -> UserPublic:
    result = await db_session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    admin = result.scalar_one()

    return to_user_public(admin)


async def create_user(db_session: AsyncSession, username: str = "user") -> User:
    user = User(
        username=username,
        email=f"{username}@example.com",
        first_name="Test",
        last_name="User",
        password_hash="hash",
        is_admin=False,
    )
    db_session.add(user)
    await db_session.commit()
    return user
