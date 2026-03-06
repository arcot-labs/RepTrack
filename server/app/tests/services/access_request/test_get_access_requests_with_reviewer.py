from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.access_request import AccessRequest
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.services.access_request import get_access_requests_with_reviewer


async def test_get_access_requests_with_reviewer(session: AsyncSession):
    access_request = AccessRequest(
        email="shape@example.com",
        first_name="Shape",
        last_name="Test",
        status=AccessRequestStatus.PENDING,
    )
    session.add(access_request)
    await session.commit()

    result = await get_access_requests_with_reviewer(session)

    assert isinstance(result[0], AccessRequest)
    assert result[0].email == "shape@example.com"
    assert result[0].first_name == "Shape"
    assert result[0].last_name == "Test"
    assert result[0].status == AccessRequestStatus.PENDING
    assert result[0].reviewer is None
    assert result[0].reviewed_at is None


async def test_get_access_requests_with_reviewer_status_ordering(session: AsyncSession):
    pending = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    approved = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    rejected = AccessRequest(
        email="rejected@example.com",
        first_name="Rejected",
        last_name="User",
        status=AccessRequestStatus.REJECTED,
    )

    session.add_all([approved, rejected, pending])
    await session.commit()

    result = await get_access_requests_with_reviewer(session)

    statuses = [item.status for item in result]
    assert statuses == [
        AccessRequestStatus.PENDING,
        AccessRequestStatus.APPROVED,
        AccessRequestStatus.REJECTED,
    ]


async def test_get_access_requests_with_reviewer_updated_at_ordering(
    session: AsyncSession,
):
    now = datetime.now(UTC)
    ar1 = AccessRequest(
        email="user1@example.com",
        first_name="User1",
        last_name="Example",
        status=AccessRequestStatus.PENDING,
        updated_at=now,
    )
    ar2 = AccessRequest(
        email="user2@example.com",
        first_name="User2",
        last_name="Example",
        status=AccessRequestStatus.PENDING,
        updated_at=now + timedelta(seconds=1),
    )

    session.add_all([ar1, ar2])
    await session.commit()

    result = await get_access_requests_with_reviewer(session)

    assert result[0].id == ar2.id
    assert result[1].id == ar1.id
    assert result[0].updated_at > result[1].updated_at


async def test_get_access_requests_with_reviewer_id_ordering(session: AsyncSession):
    now = datetime.now(UTC)
    ar1 = AccessRequest(
        email="user1@example.com",
        first_name="User1",
        last_name="Example",
        status=AccessRequestStatus.PENDING,
        updated_at=now,
    )
    ar2 = AccessRequest(
        email="user2@example.com",
        first_name="User2",
        last_name="Example",
        status=AccessRequestStatus.PENDING,
        updated_at=now,
    )

    session.add_all([ar1, ar2])
    await session.commit()

    result = await get_access_requests_with_reviewer(session)

    assert result[0].id == ar2.id
    assert result[1].id == ar1.id


async def test_get_access_requests_with_reviewer_reviewer(session: AsyncSession):
    reviewer = (
        await session.execute(select(User).where(User.username == "admin"))
    ).scalar_one()

    reviewed = AccessRequest(
        email="reviewed@example.com",
        first_name="Reviewed",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
        reviewed_by=reviewer.id,
        reviewed_at=datetime.now(UTC),
    )
    session.add(reviewed)
    await session.commit()

    result = await get_access_requests_with_reviewer(session)

    assert isinstance(result[0].reviewer, User)
    assert result[0].reviewer.id == reviewer.id
    assert result[0].reviewer.username == reviewer.username
    assert result[0].reviewed_at is not None


async def test_get_access_requests_with_reviewer_read_only(session: AsyncSession):
    before_count = await session.scalar(select(func.count()).select_from(AccessRequest))

    _ = await get_access_requests_with_reviewer(session)

    after_count = await session.scalar(select(func.count()).select_from(AccessRequest))
    assert before_count == after_count
