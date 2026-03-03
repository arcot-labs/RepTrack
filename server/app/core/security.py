import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Tuple, Type, TypeVar

import jwt
from pwdlib import PasswordHash
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute, selectinload

from app.core.config import Settings
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken
from app.models.database.user import User
from app.models.errors import InvalidCredentials
from app.models.schemas.user import JWTData

logger = logging.getLogger(__name__)

PASSWORD_HASH = PasswordHash.recommended()
TOKEN_PREFIX_LENGTH = 12
TOKEN_URLSAFE_SIZE = 32
ACCESS_JWT_KEY = "access_token"
REFRESH_JWT_KEY = "refresh_token"


T = TypeVar("T", RegistrationToken, PasswordResetToken)


async def _get_token(
    token_str: str,
    model: Type[T],
    load_option: InstrumentedAttribute[Any],
    db: AsyncSession,
) -> Optional[T]:
    token_prefix = token_str[:TOKEN_PREFIX_LENGTH]
    tokens = (
        (
            await db.execute(
                select(model)
                .options(selectinload(load_option))
                .where(model.token_prefix == token_prefix)
                .where(model.used_at.is_(None))
                .where(model.expires_at > func.now())
                .order_by(model.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    for token in tokens:
        if PASSWORD_HASH.verify(token_str, token.token_hash):
            return token


async def get_registration_token(
    token_str: str,
    db: AsyncSession,
) -> RegistrationToken | None:
    return await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db=db,
    )


async def get_password_reset_token(
    token_str: str,
    db: AsyncSession,
) -> PasswordResetToken | None:
    return await _get_token(
        token_str,
        model=PasswordResetToken,
        load_option=PasswordResetToken.user,
        db=db,
    )


async def _expire_existing_tokens(
    model: type[T],
    where_clause: list[Any],
    db: AsyncSession,
) -> None:
    await db.execute(
        update(model)
        .where(*where_clause, model.expires_at > func.now())
        .values(expires_at=func.now())
    )


async def expire_existing_registration_tokens(
    access_request_id: int,
    db: AsyncSession,
) -> None:
    logger.info(
        f"Expiring existing registration tokens for access request {access_request_id}"
    )
    await _expire_existing_tokens(
        RegistrationToken,
        [RegistrationToken.access_request_id == access_request_id],
        db,
    )


async def expire_existing_password_reset_tokens(
    user_id: int,
    db: AsyncSession,
) -> None:
    logger.info(f"Expiring existing password reset tokens for user {user_id}")
    await _expire_existing_tokens(
        PasswordResetToken,
        [PasswordResetToken.user_id == user_id],
        db,
    )


def _create_token(model: Type[T], **fields: Any) -> Tuple[str, T]:
    token_str = secrets.token_urlsafe(TOKEN_URLSAFE_SIZE)
    token_hash = PASSWORD_HASH.hash(token_str)

    token: T = model(
        token_prefix=token_str[:TOKEN_PREFIX_LENGTH],
        token_hash=token_hash,
        **fields,
    )
    return token_str, token


def create_registration_token(
    access_request_id: int,
) -> Tuple[str, RegistrationToken]:
    logger.info(f"Creating registration token for access request {access_request_id}")
    return _create_token(
        RegistrationToken,
        access_request_id=access_request_id,
    )


def create_password_reset_token(
    user_id: int,
) -> Tuple[str, PasswordResetToken]:
    logger.info(f"Creating password reset token for user {user_id}")
    return _create_token(
        PasswordResetToken,
        user_id=user_id,
    )


async def authenticate_user(
    username: str,
    password: str,
    db: AsyncSession,
) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user or not PASSWORD_HASH.verify(password, user.password_hash):
        return None
    return user


def _create_jwt(
    username: str, expires_delta: timedelta, secret_key: str, algorithm: str
) -> str:
    payload: dict[str, Any] = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + expires_delta,
    }
    token = jwt.encode(
        payload=payload,
        key=secret_key,
        algorithm=algorithm,
    )
    return str(token)


def create_access_jwt(username: str, settings: Settings):
    return _create_jwt(
        username,
        expires_delta=timedelta(minutes=settings.jwt.access_token_expire_minutes),
        secret_key=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )


def create_refresh_jwt(username: str, settings: Settings):
    return _create_jwt(
        username,
        expires_delta=timedelta(days=settings.jwt.refresh_token_expire_days),
        secret_key=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )


def verify_jwt(token: str, settings: Settings) -> str:
    try:
        # checks expiration
        payload = jwt.decode(
            jwt=token, key=settings.jwt.secret_key, algorithms=[settings.jwt.algorithm]
        )
    except Exception as e:
        logger.error(f"JWT decode error: {e}")
        raise InvalidCredentials()

    username = payload.get("sub")
    if not username:
        logger.error("JWT payload missing 'sub' field")
        raise InvalidCredentials()

    try:
        token_data = JWTData(username=username)
    except Exception as e:
        logger.error(f"JWTData validation error: {e}")
        raise InvalidCredentials()

    return token_data.username
