from sqlalchemy.ext.asyncio import AsyncSession

from app.services.access_request import (
    _get_access_request_by_id,  # pyright: ignore[reportPrivateUsage]
)
from app.tests.core.security.utilities import create_access_request


async def test_get_access_request_by_id(db_session: AsyncSession):
    created = await create_access_request(db_session, "by-id@example.com")
    await db_session.commit()

    result = await _get_access_request_by_id(created.id, db_session)

    assert result is not None
    assert result.id == created.id
    assert result.email == "by-id@example.com"


async def test_get_access_request_by_id_not_found(db_session: AsyncSession):
    result = await _get_access_request_by_id(999999, db_session)

    assert result is None
