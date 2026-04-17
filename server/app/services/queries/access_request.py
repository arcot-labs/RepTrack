from collections.abc import Sequence

from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database.access_request import AccessRequest
from app.models.enums import AccessRequestStatus

_STATUS_PRIORITY = case(
    (AccessRequest.status == AccessRequestStatus.PENDING, 1),
    (AccessRequest.status == AccessRequestStatus.APPROVED, 2),
    (AccessRequest.status == AccessRequestStatus.REJECTED, 3),
)


async def select_latest_access_request_by_email(
    db_session: AsyncSession,
    email: str,
) -> AccessRequest | None:
    result = await db_session.execute(
        select(AccessRequest)
        .where(AccessRequest.email == email)
        .order_by(AccessRequest.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def select_access_request_by_id(
    db_session: AsyncSession,
    access_request_id: int,
) -> AccessRequest | None:
    result = await db_session.execute(
        select(AccessRequest).where(
            AccessRequest.id == access_request_id,
        )
    )
    return result.scalar_one_or_none()


async def select_access_requests(
    db_session: AsyncSession,
) -> Sequence[AccessRequest]:
    result = await db_session.execute(
        select(AccessRequest)
        .options(selectinload(AccessRequest.reviewer))
        .order_by(_STATUS_PRIORITY)
        .order_by(AccessRequest.updated_at.desc())
        .order_by(AccessRequest.id.desc())
    )
    return result.scalars().all()
