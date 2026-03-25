from meilisearch_python_sdk import AsyncClient
from pytest import MonkeyPatch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.search import reindex_data


async def test_reindex_data(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: MonkeyPatch,
):
    calls: list[str] = []

    async def fake_muscle_groups(db_session: AsyncSession, client: AsyncClient) -> None:
        calls.append("muscle")

    async def fake_exercises(db_session: AsyncSession, client: AsyncClient) -> None:
        calls.append("exercise")

    monkeypatch.setattr("app.services.search._index_muscle_groups", fake_muscle_groups)
    monkeypatch.setattr("app.services.search._index_exercises", fake_exercises)

    await reindex_data(db_session, ms_client)

    assert calls == ["muscle", "exercise"]
