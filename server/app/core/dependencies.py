import logging
from collections.abc import AsyncGenerator
from functools import cache
from typing import Annotated

from fastapi import Depends
from fastapi.security import APIKeyCookie
from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import Settings, get_settings
from app.core.security import ACCESS_JWT_KEY, REFRESH_JWT_KEY, verify_jwt
from app.models.errors import InsufficientPermissions, InvalidCredentials
from app.models.schemas.user import UserPublic
from app.services.queries.user import select_user_by_username
from app.services.utilities.serializers import to_user_public

logger = logging.getLogger(__name__)


access_token_cookie = APIKeyCookie(
    name=ACCESS_JWT_KEY,
)

refresh_token_cookie = APIKeyCookie(
    name=REFRESH_JWT_KEY,
)


@cache
def get_db_sessionmaker(db_url: str, is_prod: bool):
    engine = create_async_engine(
        db_url,
        echo=not is_prod,
    )
    return async_sessionmaker(
        bind=engine,
        expire_on_commit=False,
    )


def get_db_session_factory(
    settings: Annotated[Settings, Depends(get_settings)],
) -> async_sessionmaker[AsyncSession]:
    return get_db_sessionmaker(
        settings.db.url,
        settings.is_prod_like,
    )


async def get_db_session(
    db_session_factory: Annotated[
        async_sessionmaker[AsyncSession], Depends(get_db_session_factory)
    ],
) -> AsyncGenerator[AsyncSession]:
    async with db_session_factory() as session:
        yield session


@cache
def build_ms_client(host: str, port: int, master_key: str) -> AsyncClient:
    url = f"http://{host}:{port}"
    return AsyncClient(url, master_key)


async def get_ms_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AsyncClient:
    return build_ms_client(
        settings.ms.host,
        settings.ms.port,
        settings.ms.master_key,
    )


async def get_current_user(
    token: Annotated[str, Depends(access_token_cookie)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> UserPublic:
    logger.info("Getting current user using jwt")

    username = verify_jwt(token, settings)
    user = await select_user_by_username(db_session, username)
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
