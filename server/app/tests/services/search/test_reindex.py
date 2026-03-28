from types import SimpleNamespace

from meilisearch_python_sdk import AsyncClient
from pytest import MonkeyPatch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.search import reindex


async def test_reindex(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    monkeypatch: MonkeyPatch,
):
    calls: list[str] = []
    deleted_indexes: list[str] = []

    async def fake_get_indexes() -> list[SimpleNamespace]:
        return [SimpleNamespace(uid="muscle_groups")]

    async def fake_delete_index_if_exists(uid: str) -> None:
        deleted_indexes.append(uid)

    async def fake_muscle_groups(
        db_session: AsyncSession,
        client: AsyncClient,
    ) -> int:
        calls.append("muscle")
        return 1

    async def fake_exercises(
        db_session: AsyncSession,
        client: AsyncClient,
    ) -> int:
        calls.append("exercise")
        return 2

    monkeypatch.setattr(ms_client, "get_indexes", fake_get_indexes)
    monkeypatch.setattr(
        ms_client, "delete_index_if_exists", fake_delete_index_if_exists
    )
    monkeypatch.setattr("app.services.search._index_muscle_groups", fake_muscle_groups)
    monkeypatch.setattr("app.services.search._index_exercises", fake_exercises)

    await reindex(db_session, ms_client)

    assert deleted_indexes == ["muscle_groups"]
    assert calls == ["muscle", "exercise"]
