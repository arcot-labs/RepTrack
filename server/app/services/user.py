from collections.abc import Sequence

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User


async def get_admin_users(db: AsyncSession) -> Sequence[User]:
    result = await db.execute(select(User).where(User.is_admin))
    return result.scalars().all()


async def get_user_by_username(
    username: str,
    db: AsyncSession,
) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_email(
    email: str,
    db: AsyncSession,
) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_identifier(
    identifier: str,
    db: AsyncSession,
) -> User | None:
    result = await db.execute(
        select(User).where(
            or_(
                User.username == identifier,
                User.email == identifier,
            )
        )
    )
    return result.scalar_one_or_none()


async def get_users_ordered_by_username(db: AsyncSession) -> Sequence[User]:
    result = await db.execute(select(User).order_by(User.username.asc()))
    return result.scalars().all()
