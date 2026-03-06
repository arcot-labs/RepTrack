import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.dependencies import get_db


async def test_get_db(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    generator = get_db(settings)

    session = await anext(generator)
    assert isinstance(session, AsyncSession)
    assert session.bind.url.drivername == "postgresql+asyncpg"  # type: ignore
    assert session.bind.url.username == settings.db.user  # type: ignore
    assert session.bind.url.host == settings.db.host  # type: ignore
    assert session.bind.url.port == settings.db.port  # type: ignore
    assert session.bind.url.database == settings.db.name  # type: ignore

    with pytest.raises(StopAsyncIteration):
        await anext(generator)
