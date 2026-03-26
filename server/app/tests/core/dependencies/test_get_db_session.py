import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.dependencies import get_db_session


async def test_get_db_session(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    generator = get_db_session(settings)

    db_session = await anext(generator)
    assert isinstance(db_session, AsyncSession)
    assert db_session.bind.url.drivername == "postgresql+asyncpg"  # type: ignore
    assert db_session.bind.url.username == settings.db.user  # type: ignore
    assert db_session.bind.url.host == settings.db.host  # type: ignore
    assert db_session.bind.url.port == settings.db.port  # type: ignore
    assert db_session.bind.url.database == settings.db.name  # type: ignore

    with pytest.raises(StopAsyncIteration):
        await anext(generator)
