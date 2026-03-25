from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.user import User


async def get_admin(db_session: AsyncSession, settings: Settings) -> User:
    result = await db_session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    return result.scalar_one()
