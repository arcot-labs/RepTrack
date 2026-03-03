import logging
from typing import Literal

from fastapi import BackgroundTasks
from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.core.config import Settings
from app.models.database.access_request import AccessRequest
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.models.errors import AccessRequestStatusError, NotFound
from app.models.schemas.access_request import AccessRequestPublic
from app.models.schemas.user import UserPublic
from app.services.auth import create_registration_token
from app.services.email import EmailService

logger = logging.getLogger(__name__)

status_priority = case(
    (AccessRequest.status == AccessRequestStatus.PENDING, 1),
    (AccessRequest.status == AccessRequestStatus.APPROVED, 2),
    (AccessRequest.status == AccessRequestStatus.REJECTED, 3),
)


async def get_access_requests(db: AsyncSession) -> list[AccessRequestPublic]:
    logger.info("Getting access requests")

    result = await db.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.reviewer))
        .order_by(status_priority)
        .order_by(AccessRequest.updated_at.desc())
        .order_by(AccessRequest.id.desc())
    )
    return [
        AccessRequestPublic.model_validate(ar, from_attributes=True)
        for ar in result.scalars().all()
    ]


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

    access_request = (
        await db.execute(
            select(AccessRequest).where(AccessRequest.id == access_request_id)
        )
    ).scalar_one_or_none()

    if not access_request:
        logger.error(f"Access request {access_request_id} not found")
        raise NotFound()

    if access_request.status != AccessRequestStatus.PENDING:
        raise AccessRequestStatusError()

    access_request.status = status
    access_request.reviewed_at = func.now()
    access_request.reviewed_by = user.id

    token_str, token = create_registration_token(access_request.id)
    db.add(token)
    await db.commit()

    if status == AccessRequestStatus.APPROVED:
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

    result = await db.execute(
        select(User)
        .order_by(User.username.asc())
        .order_by(User.updated_at.desc())
        .order_by(User.id.desc())
    )
    return [
        UserPublic.model_validate(user, from_attributes=True)
        for user in result.scalars().all()
    ]
