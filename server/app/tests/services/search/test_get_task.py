from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.task import TaskResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.search import (
    _index_muscle_groups,  # pyright: ignore[reportPrivateUsage]
    get_task,
)

from .utilities import wait_for_task


async def test_get_task(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    task = await _index_muscle_groups(db_session, ms_client)
    await wait_for_task(ms_client, task)

    task = await get_task(ms_client, task)
    assert task is not None
    assert isinstance(task, TaskResult)
    assert task.status == "succeeded"
