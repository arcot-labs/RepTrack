from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.access_request import AccessRequest
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.models.schemas.access_request import AccessRequestPublic, ReviewerPublic
from app.services.access_request import get_access_requests


async def test_get_access_requests(
    db_session: AsyncSession,
):
    access_request = AccessRequest(
        email="shape@example.com",
        first_name="Shape",
        last_name="Test",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(access_request)
    await db_session.commit()

    result = await get_access_requests(db_session)

    assert isinstance(result[0], AccessRequestPublic)
    assert result[0].email == "shape@example.com"
    assert result[0].first_name == "Shape"
    assert result[0].last_name == "Test"
    assert result[0].status == AccessRequestStatus.PENDING
    assert result[0].reviewer is None
    assert result[0].reviewed_at is None


async def test_get_access_requests_reviewer(db_session: AsyncSession):
    reviewer = (
        await db_session.execute(select(User).where(User.username == "admin"))
    ).scalar_one()

    reviewed = AccessRequest(
        email="reviewed@example.com",
        first_name="Reviewed",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
        reviewed_by=reviewer.id,
        reviewed_at=datetime.now(UTC),
    )
    db_session.add(reviewed)
    await db_session.commit()

    result = await get_access_requests(db_session)

    assert isinstance(result[0].reviewer, ReviewerPublic)
    assert result[0].reviewer.id == reviewer.id
    assert result[0].reviewer.username == reviewer.username
    assert result[0].reviewed_at is not None
