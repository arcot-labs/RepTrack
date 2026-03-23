from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.user import User
from app.models.schemas.types import is_email_identifier
from app.models.schemas.user import UserPublic


def to_user_public(user: User) -> UserPublic:
    return UserPublic.model_validate(user, from_attributes=True)


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
    if is_email_identifier(identifier):
        user = await get_user_by_email(identifier, db)
        if user:
            return user
        return await get_user_by_username(identifier, db)

    return await get_user_by_username(identifier, db)


async def get_users_ordered_by_username(db: AsyncSession) -> Sequence[User]:
    result = await db.execute(select(User).order_by(User.username.asc()))
    return result.scalars().all()
