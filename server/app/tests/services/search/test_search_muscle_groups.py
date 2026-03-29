import logging

from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas.muscle_group import MuscleGroupSearchResult
from app.models.schemas.search import SearchRequest
from app.services.search import (
    _index_muscle_groups,  # pyright: ignore[reportPrivateUsage]
    search_muscle_groups,
)

from ..muscle_group.utilities import create_muscle_group
from .utilities import wait_for_task

logger = logging.getLogger(__name__)


async def test_search_muscle_groups(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    mg = await create_muscle_group(
        db_session,
        name="muscle group 1",
        description="Muscle group 1",
    )

    task = await _index_muscle_groups(db_session, ms_client)
    await wait_for_task(ms_client, task)

    results = await search_muscle_groups(
        SearchRequest(query="1", limit=10),
        ms_client,
    )

    assert isinstance(results, list)
    assert len(results) == 1

    hit = results[0]
    MuscleGroupSearchResult.model_validate(hit)
    assert hit.id == mg.id
