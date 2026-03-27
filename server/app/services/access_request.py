import logging
from collections.abc import Sequence
from typing import Literal

from fastapi import BackgroundTasks
from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.core.config import Settings
from app.core.security import create_registration_token
from app.models.database.access_request import AccessRequest
from app.models.enums import AccessRequestStatus
from app.models.errors import AccessRequestNotFound, AccessRequestNotPending
from app.models.schemas.access_request import AccessRequestPublic
from app.models.schemas.user import UserPublic
from app.services.email import EmailService
from app.services.utilities.serializers import to_access_request_public

logger = logging.getLogger(__name__)


STATUS_PRIORITY = case(
    (AccessRequest.status == AccessRequestStatus.PENDING, 1),
    (AccessRequest.status == AccessRequestStatus.APPROVED, 2),
    (AccessRequest.status == AccessRequestStatus.REJECTED, 3),
)


async def get_latest_access_request_by_email(
    email: str, db_session: AsyncSession
) -> AccessRequest | None:
    result = await db_session.execute(
        select(AccessRequest)
        .where(AccessRequest.email == email)
        .order_by(AccessRequest.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _get_access_request_by_id(
    access_request_id: int, db_session: AsyncSession
) -> AccessRequest | None:
    result = await db_session.execute(
        select(AccessRequest).where(AccessRequest.id == access_request_id)
    )
    return result.scalar_one_or_none()


async def _get_access_requests_with_reviewer(
    db_session: AsyncSession,
) -> Sequence[AccessRequest]:
    result = await db_session.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.reviewer))
        .order_by(STATUS_PRIORITY)
        .order_by(AccessRequest.updated_at.desc())
        .order_by(AccessRequest.id.desc())
    )
    return result.scalars().all()


async def get_access_requests(
    db_session: AsyncSession,
) -> list[AccessRequestPublic]:
    logger.info("Getting access requests")

    requests = await _get_access_requests_with_reviewer(db_session)
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

    access_request = await _get_access_request_by_id(access_request_id, db_session)

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
            email_svc.send_access_request_rejected_email, settings, access_request
        )
