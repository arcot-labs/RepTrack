from sqlalchemy.ext.asyncio import AsyncSession

from app.services.queries.access_request import (
    select_access_request_by_id,
)
from app.tests.core.security.utilities import create_access_request


async def test_select_access_request_by_id(db_session: AsyncSession):
    created = await create_access_request(db_session, "by-id@example.com")
    await db_session.commit()

    result = await select_access_request_by_id(db_session, created.id)

    assert result is not None
    assert result.id == created.id
    assert result.email == "by-id@example.com"


async def test_select_access_request_by_id_not_found(db_session: AsyncSession):
    result = await select_access_request_by_id(db_session, 999999)

    assert result is None
