import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pwdlib import PasswordHash
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.core.config import Settings
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken
from app.models.database.user import User
from app.models.errors import InvalidCredentials
from app.models.schemas.user import JWTData
from app.services.token import expire_tokens, get_tokens_by_prefix
from app.services.user import get_user_by_identifier

logger = logging.getLogger(__name__)

PASSWORD_HASH = PasswordHash.recommended()
TOKEN_PREFIX_LENGTH = 12
TOKEN_URLSAFE_SIZE = 32
ACCESS_JWT_KEY = "access_token"
REFRESH_JWT_KEY = "refresh_token"


def hash_secret(secret: str) -> str:
    return PASSWORD_HASH.hash(secret)


def verify_secret(secret: str, secret_hash: str) -> bool:
    try:
        return PASSWORD_HASH.verify(secret, secret_hash)
    except Exception as e:
        logger.error(f"Secret verification error: {e}")
        return False


async def _get_token[T: (RegistrationToken, PasswordResetToken)](
    token_str: str,
    model: type[T],
    load_option: InstrumentedAttribute[Any],
    db_session: AsyncSession,
) -> T | None:
    token_prefix = token_str[:TOKEN_PREFIX_LENGTH]
    tokens = await get_tokens_by_prefix(model, load_option, token_prefix, db_session)
    for token in tokens:
        if verify_secret(token_str, token.token_hash):
            return token


async def get_registration_token(
    token_str: str,
    db_session: AsyncSession,
) -> RegistrationToken | None:
    return await _get_token(
        token_str,
        model=RegistrationToken,
        load_option=RegistrationToken.access_request,
        db_session=db_session,
    )


async def get_password_reset_token(
    token_str: str,
    db_session: AsyncSession,
) -> PasswordResetToken | None:
    return await _get_token(
        token_str,
        model=PasswordResetToken,
        load_option=PasswordResetToken.user,
        db_session=db_session,
    )


async def expire_existing_registration_tokens(
    access_request_id: int,
    db_session: AsyncSession,
) -> None:
    logger.info(
        f"Expiring existing registration tokens for access request {access_request_id}"
    )
    await expire_tokens(
        RegistrationToken,
        [RegistrationToken.access_request_id == access_request_id],
        db_session,
    )


async def expire_existing_password_reset_tokens(
    user_id: int,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Expiring existing password reset tokens for user {user_id}")
    await expire_tokens(
        PasswordResetToken,
        [PasswordResetToken.user_id == user_id],
        db_session,
    )


def _create_token[T: (RegistrationToken, PasswordResetToken)](
    model: type[T], **fields: Any
) -> tuple[str, T]:
    token_str = secrets.token_urlsafe(TOKEN_URLSAFE_SIZE)
    token_hash = hash_secret(token_str)

    token: T = model(
        token_prefix=token_str[:TOKEN_PREFIX_LENGTH],
        token_hash=token_hash,
        **fields,
    )
    return token_str, token


def create_registration_token(
    access_request_id: int,
) -> tuple[str, RegistrationToken]:
    logger.info(f"Creating registration token for access request {access_request_id}")
    return _create_token(
        RegistrationToken,
        access_request_id=access_request_id,
    )


def create_password_reset_token(
    user_id: int,
) -> tuple[str, PasswordResetToken]:
    logger.info(f"Creating password reset token for user {user_id}")
    return _create_token(
        PasswordResetToken,
        user_id=user_id,
    )


async def authenticate_user(
    identifier: str,
    password: str,
    db_session: AsyncSession,
) -> User | None:
    user = await get_user_by_identifier(identifier, db_session)
    if not user or not verify_secret(password, user.password_hash):
        return None
    return user


def _create_jwt(
    username: str, expires_delta: timedelta, secret_key: str, algorithm: str
) -> str:
    payload: dict[str, Any] = {
        "sub": username,
        "exp": datetime.now(UTC) + expires_delta,
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
