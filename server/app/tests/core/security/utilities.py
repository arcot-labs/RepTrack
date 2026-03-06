from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.access_request import AccessRequest, AccessRequestStatus


async def create_access_request(session: AsyncSession, email: str) -> AccessRequest:
    access_request = AccessRequest(
        email=email,
        first_name="Test",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.flush()
    return access_request
