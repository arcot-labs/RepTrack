import logging
from typing import cast

from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.search import SearchResults
from meilisearch_python_sdk.models.settings import MeilisearchSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.enums import SearchIndex
from app.models.schemas.exercise import ExercisePublic
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.models.schemas.search import SearchRequest
from app.services.utilities.queries import query_exercises
from app.services.utilities.serializers import (
    to_exercise_public,
    to_muscle_group_public,
)

logger = logging.getLogger(__name__)


async def reindex_data(
    db: AsyncSession,
    ms_client: AsyncClient,
):
    await _index_muscle_groups(db, ms_client)
    await _index_exercises(db, ms_client)


async def _index_muscle_groups(
    db: AsyncSession,
    ms_client: AsyncClient,
):
    result = await db.execute(select(MuscleGroup))
    muscle_groups = result.scalars().all()
    public = [to_muscle_group_public(mg) for mg in muscle_groups]

    await ms_client.delete_index_if_exists(SearchIndex.MUSCLE_GROUPS)
    index = await ms_client.get_or_create_index(SearchIndex.MUSCLE_GROUPS)
    await index.add_documents([mg.model_dump() for mg in public])


async def _index_exercises(
    db: AsyncSession,
    ms_client: AsyncClient,
):
    exercises = await query_exercises(db, base=False)
    public = [to_exercise_public(e) for e in exercises]

    await ms_client.delete_index_if_exists(SearchIndex.EXERCISES)

    settings = MeilisearchSettings(
        searchable_attributes=[
            "name",
            "description",
            "muscle_groups.name",
        ],
        displayed_attributes=[
            "id",
            "user_id",
            "name",
            "description",
            "muscle_groups.id",
            "muscle_groups.name",
        ],
        filterable_attributes=[
            "user_id",
        ],
    )

    index = await ms_client.get_or_create_index(SearchIndex.EXERCISES)
    await index.update_settings(settings)
    await index.add_documents(
        [
            e.model_dump(
                exclude={"created_at", "updated_at"},
            )
            for e in public
        ],
        primary_key="id",
    )


async def search_muscle_groups(
    req: SearchRequest,
    ms_client: AsyncClient,
):
    logger.info(f"Searching muscle groups with query: '{req.query}'")
    return await _search(
        model=MuscleGroupPublic,
        ms_client=ms_client,
        index=SearchIndex.MUSCLE_GROUPS,
        query=req.query,
        limit=req.limit,
    )


async def search_exercises(
    req: SearchRequest,
    user_id: int,
    ms_client: AsyncClient,
):
    logger.info(f"Searching exercises with query: '{req.query}' and user_id: {user_id}")
    return await _search(
        model=ExercisePublic,
        ms_client=ms_client,
        index=SearchIndex.EXERCISES,
        query=req.query,
        filter=f"user_id IS NULL OR user_id = {user_id}",
        limit=req.limit,
    )


async def _search[T](
    model: type[T],
    ms_client: AsyncClient,
    index: SearchIndex,
    query: str,
    filter: str | None = None,
    limit: int = 20,
) -> SearchResults[T]:
    _index = await ms_client.get_or_create_index(
        index,
        hits_type=model,
    )
    raw = await _index.search(  # type: ignore
        query=query,
        filter=filter,
        limit=limit,
    )
    logger.info(f"Search returned {raw}")
    typed_hits = [model(**hit) for hit in raw.hits]  # type: ignore
    raw.hits = typed_hits
    return cast(SearchResults[T], raw)
