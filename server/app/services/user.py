from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.models.schemas.types import is_email_identifier


async def get_admin_users(db_session: AsyncSession) -> Sequence[User]:
    result = await db_session.execute(select(User).where(User.is_admin))
    return result.scalars().all()


async def get_user_by_username(
    username: str,
    db_session: AsyncSession,
) -> User | None:
    result = await db_session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(
    email: str,
    db_session: AsyncSession,
) -> User | None:
    result = await db_session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_identifier(
    identifier: str,
    db_session: AsyncSession,
) -> User | None:
    if is_email_identifier(identifier):
        user = await get_user_by_email(identifier, db_session)
        if user:
            return user
        return await get_user_by_username(identifier, db_session)

    return await get_user_by_username(identifier, db_session)


async def get_users_ordered_by_username(db_session: AsyncSession) -> Sequence[User]:
    result = await db_session.execute(select(User).order_by(User.username.asc()))
    return result.scalars().all()
