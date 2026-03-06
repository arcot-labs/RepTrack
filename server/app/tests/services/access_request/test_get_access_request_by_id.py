from sqlalchemy.ext.asyncio import AsyncSession

from app.services.access_request import get_access_request_by_id
from app.tests.core.security.utilities import create_access_request


async def test_get_access_request_by_id(session: AsyncSession):
    created = await create_access_request(session, "by-id@example.com")
    await session.commit()

    result = await get_access_request_by_id(created.id, session)

    assert result is not None
    assert result.id == created.id
    assert result.email == "by-id@example.com"


async def test_get_access_request_by_id_not_found(session: AsyncSession):
    result = await get_access_request_by_id(999999, session)

    assert result is None
