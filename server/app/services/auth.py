import logging
from datetime import UTC, datetime

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import (
    authenticate_user,
    create_access_jwt,
    create_password_reset_token,
    create_refresh_jwt,
    create_registration_token,
    expire_existing_password_reset_tokens,
    expire_existing_registration_tokens,
    get_password_reset_token,
    get_registration_token,
    hash_secret,
    verify_jwt,
)
from app.models.api import LoginResult
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.user import User
from app.models.errors import (
    AccessRequestPending,
    AccessRequestRejected,
    EmailInUse,
    InvalidCredentials,
    InvalidToken,
    UsernameTaken,
)
from app.services.access_request import get_latest_access_request_by_email
from app.services.user import get_admin_users, get_user_by_email, get_user_by_username

from .email import EmailService

logger = logging.getLogger(__name__)


async def request_access(
    email: str,
    first_name: str,
    last_name: str,
    background_tasks: BackgroundTasks,
    db_session: AsyncSession,
    email_svc: EmailService,
    settings: Settings,
) -> bool:
    """Returns True if access was already approved, False otherwise"""
    logger.info(f"Requesting access for email: {email}")

    existing_user_by_email = await get_user_by_email(email, db_session)
    existing_user_by_username = await get_user_by_username(email, db_session)
    if existing_user_by_email or existing_user_by_username:
        raise EmailInUse()

    existing_request = await get_latest_access_request_by_email(email, db_session)
    if existing_request:
        logger.info(
            f"Found existing access request for email {email} with id {existing_request.id}"
        )
        match existing_request.status:
            case AccessRequestStatus.PENDING:
                raise AccessRequestPending()
            case AccessRequestStatus.REJECTED:
                raise AccessRequestRejected()
            case _:
                await expire_existing_registration_tokens(
                    existing_request.id, db_session
                )

                token_str, token = create_registration_token(existing_request.id)
                db_session.add(token)
                await db_session.commit()

                background_tasks.add_task(
                    email_svc.send_access_request_approved_email,
                    settings,
                    existing_request,
                    token_str,
                )
                return True

    logger.info(f"Creating new access request for email: {email}")
    access_request = AccessRequest(
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    db_session.add(access_request)
    await db_session.commit()

    admins = await get_admin_users(db_session)
    for admin in admins:
        background_tasks.add_task(
            email_svc.send_access_request_notification_email,
            settings,
            admin.email,
            access_request,
        )

    return False


async def register(
    token_str: str,
    username: str,
    password: str,
    db_session: AsyncSession,
) -> None:
    logger.info(f"Registering new user {username}")

    token = await get_registration_token(token_str, db_session)
    if not token or token.is_used() or token.is_expired():
        raise InvalidToken()

    access_request = token.access_request
    if access_request.status != AccessRequestStatus.APPROVED:
        raise InvalidToken()

    existing_user_by_username = await get_user_by_username(username, db_session)
    existing_user_by_email = await get_user_by_email(username, db_session)
    if existing_user_by_username or existing_user_by_email:
        raise UsernameTaken()

    token.used_at = datetime.now(UTC)
    await expire_existing_registration_tokens(access_request.id, db_session)

    user = User(
        username=username,
        email=access_request.email,
        first_name=access_request.first_name,
        last_name=access_request.last_name,
        password_hash=hash_secret(password),
    )
    db_session.add(user)
    await db_session.commit()


async def request_password_reset(
    email: str,
    background_tasks: BackgroundTasks,
    db_session: AsyncSession,
    email_svc: EmailService,
    settings: Settings,
) -> None:
    logger.info(f"Requesting password reset for email: {email}")

    if email == settings.admin.email:
        logger.warning("Password reset requested for admin email, ignoring")
        return

    user = await get_user_by_email(email, db_session)
    if not user:
        logger.info(f"Password reset requested for unregistered email: {email}")
        return

    await expire_existing_password_reset_tokens(user.id, db_session)

    token_str, token = create_password_reset_token(user.id)
    db_session.add(token)
    await db_session.commit()

    background_tasks.add_task(
        email_svc.send_password_reset_email,
        settings,
        user.email,
        token_str,
    )


async def reset_password(
    token_str: str,
    password: str,
    db_session: AsyncSession,
) -> None:
    logger.info("Resetting password")

    token = await get_password_reset_token(token_str, db_session)
    if not token or token.is_used() or token.is_expired():
        raise InvalidToken()

    user = token.user
    token.used_at = datetime.now(UTC)
    await expire_existing_password_reset_tokens(user.id, db_session)

    user.password_hash = hash_secret(password)
    await db_session.commit()


async def login(
    identifier: str,
    password: str,
    db_session: AsyncSession,
    settings: Settings,
) -> LoginResult:
    logger.info(f"Logging in user with identifier {identifier}")

    user = await authenticate_user(identifier, password, db_session)
    if not user:
        raise InvalidCredentials()

    access_token = create_access_jwt(user.username, settings)
    refresh_token = create_refresh_jwt(user.username, settings)

    return LoginResult(
        access_token=access_token,
        refresh_token=refresh_token,
    )


async def refresh(db_session: AsyncSession, token: str, settings: Settings) -> str:
    logger.info("Refreshing access token")

    username = verify_jwt(token, settings)
    user = await get_user_by_username(username, db_session)
    if not user:
        raise InvalidCredentials()

    return create_access_jwt(user.username, settings)
