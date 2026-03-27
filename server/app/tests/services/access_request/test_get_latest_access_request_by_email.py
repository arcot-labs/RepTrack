from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.access_request import AccessRequest
from app.models.enums import AccessRequestStatus
from app.services.access_request import get_latest_access_request_by_email


async def test_get_latest_access_request_by_email(db_session: AsyncSession):
    now = datetime.now(UTC)
    older = AccessRequest(
        email="latest@example.com",
        first_name="Older",
        last_name="Request",
        status=AccessRequestStatus.APPROVED,
        created_at=now,
    )
    newer = AccessRequest(
        email="latest@example.com",
        first_name="Newer",
        last_name="Request",
        status=AccessRequestStatus.PENDING,
        created_at=now + timedelta(seconds=1),
    )

    db_session.add_all([older, newer])
    await db_session.commit()

    result = await get_latest_access_request_by_email("latest@example.com", db_session)

    assert result is not None
    assert result.id == newer.id
    assert result.first_name == "Newer"


async def test_get_latest_access_request_by_email_not_found(db_session: AsyncSession):
    result = await get_latest_access_request_by_email("missing@example.com", db_session)

    assert result is None
