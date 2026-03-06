from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.user import User
from app.models.schemas.user import UserPublic


async def get_admin_user_public(
    session: AsyncSession, settings: Settings
) -> UserPublic:
    result = await session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    admin = result.scalar_one()

    return UserPublic.model_validate(admin, from_attributes=True)
