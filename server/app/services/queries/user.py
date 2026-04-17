from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User


async def select_admin_users(
    db_session: AsyncSession,
) -> Sequence[User]:
    result = await db_session.execute(
        select(User).where(
            User.is_admin,
        )
    )
    return result.scalars().all()


async def select_user_by_username(
    db_session: AsyncSession,
    username: str,
) -> User | None:
    result = await db_session.execute(
        select(User).where(
            User.username == username,
        )
    )
    return result.scalar_one_or_none()


async def select_user_by_email(
    db_session: AsyncSession,
    email: str,
) -> User | None:
    result = await db_session.execute(
        select(User).where(
            User.email == email,
        )
    )
    return result.scalar_one_or_none()


async def select_users(
    db_session: AsyncSession,
) -> Sequence[User]:
    result = await db_session.execute(
        select(User).order_by(
            User.username.asc(),
        )
    )
    return result.scalars().all()
