import logging
from collections.abc import AsyncGenerator
from functools import cache
from typing import Annotated

from fastapi import Depends
from fastapi.security import APIKeyCookie
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.core.security import ACCESS_JWT_KEY, REFRESH_JWT_KEY, verify_jwt
from app.models.errors import InsufficientPermissions, InvalidCredentials
from app.models.schemas.user import UserPublic
from app.services.user import get_user_by_username, to_user_public

logger = logging.getLogger(__name__)


@cache
def get_sessionmaker(db_url: str, is_prod: bool):
    engine = create_async_engine(
        db_url,
        echo=not is_prod,
    )
    return async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )


async def get_db(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AsyncGenerator[AsyncSession]:
    async with get_sessionmaker(settings.db.url, settings.is_prod_like)() as session:
        yield session


access_token_cookie = APIKeyCookie(
    name=ACCESS_JWT_KEY,
)

refresh_token_cookie = APIKeyCookie(
    name=REFRESH_JWT_KEY,
)


async def get_current_user(
    token: Annotated[str, Depends(access_token_cookie)],
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserPublic:
    logger.info("Getting current user using jwt")

    username = verify_jwt(token, settings)
    user = await get_user_by_username(username, db)
    if not user:
        raise InvalidCredentials()

    return to_user_public(user)


async def get_current_admin(
    user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    logger.info("Getting current admin user")

    if not user.is_admin:
        logger.error(f"User {user.username} is not an admin")
        raise InsufficientPermissions()
    return user
