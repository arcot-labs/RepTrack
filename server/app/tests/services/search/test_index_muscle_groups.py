from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SearchIndex
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.search import (
    _index_muscle_groups,  # pyright: ignore[reportPrivateUsage]
)

from ..muscle_group.utilities import create_muscle_group
from .utilities import wait_for_task


async def test_index_muscle_groups(
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

    index = await ms_client.get_or_create_index(SearchIndex.MUSCLE_GROUPS)
    doc = await index.get_document(str(mg.id))

    MuscleGroupPublic.model_validate(doc)
    assert doc["id"] == mg.id
    assert doc["name"] == mg.name
    assert doc["description"] == mg.description
