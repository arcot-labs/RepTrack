import logging
from typing import Literal

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.core.config import Settings
from app.core.security import create_registration_token
from app.models.enums import AccessRequestStatus
from app.models.errors import AccessRequestNotFound, AccessRequestNotPending
from app.models.schemas.access_request import AccessRequestPublic
from app.models.schemas.user import UserPublic
from app.services.access_request import (
    get_access_request_by_id,
    get_access_requests_with_reviewer,
    to_access_request_public,
)
from app.services.email import EmailService
from app.services.user import get_users_ordered_by_username, to_user_public

logger = logging.getLogger(__name__)


async def get_access_requests(db: AsyncSession) -> list[AccessRequestPublic]:
    logger.info("Getting access requests")

    requests = await get_access_requests_with_reviewer(db)
    return [to_access_request_public(r) for r in requests]


async def update_access_request_status(
    access_request_id: int,
    status: Literal[AccessRequestStatus.APPROVED, AccessRequestStatus.REJECTED],
    db: AsyncSession,
    user: UserPublic,
    background_tasks: BackgroundTasks,
    email_svc: EmailService,
    settings: Settings,
) -> None:
    logger.info(f"Updating access request {access_request_id} to status {status}")

    access_request = await get_access_request_by_id(access_request_id, db)

    if not access_request:
        logger.error(f"Access request {access_request_id} not found")
        raise AccessRequestNotFound()

    if access_request.status != AccessRequestStatus.PENDING:
        raise AccessRequestNotPending()

    access_request.status = status
    access_request.reviewed_at = func.now()
    access_request.reviewed_by = user.id

    token_str: str | None = None
    if status == AccessRequestStatus.APPROVED:
        token_str, token = create_registration_token(access_request.id)
        db.add(token)

    await db.commit()

    if status == AccessRequestStatus.APPROVED:
        assert token_str is not None
        background_tasks.add_task(
            email_svc.send_access_request_approved_email,
            settings,
            access_request,
            token_str,
        )
    else:
        background_tasks.add_task(
            email_svc.send_access_request_rejected_email, settings, access_request
        )


async def get_users(db: AsyncSession) -> list[UserPublic]:
    logger.info("Getting users")

    users = await get_users_ordered_by_username(db)
    return [to_user_public(user) for user in users]
