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
from app.services.email import EmailService
from app.services.queries.access_request import (
    select_access_request_by_id,
    select_access_requests,
)
from app.services.utilities.serializers import to_access_request_public

logger = logging.getLogger(__name__)


async def get_access_requests(
    db_session: AsyncSession,
) -> list[AccessRequestPublic]:
    logger.info("Getting access requests")

    requests = await select_access_requests(db_session)
    return [to_access_request_public(r) for r in requests]


async def update_access_request_status(
    access_request_id: int,
    status: Literal[AccessRequestStatus.APPROVED, AccessRequestStatus.REJECTED],
    db_session: AsyncSession,
    user: UserPublic,
    background_tasks: BackgroundTasks,
    email_svc: EmailService,
    settings: Settings,
) -> None:
    logger.info(f"Updating access request {access_request_id} to status {status}")

    access_request = await select_access_request_by_id(db_session, access_request_id)

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
        db_session.add(token)

    await db_session.commit()

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
            email_svc.send_access_request_rejected_email,
            settings,
            access_request,
        )
