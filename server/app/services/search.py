import logging
from typing import cast

from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.search import SearchResults
from meilisearch_python_sdk.models.settings import MeilisearchSettings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.muscle_group import MuscleGroup
from app.models.enums import SearchIndex
from app.models.schemas.exercise import ExerciseDocument
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.models.schemas.search import SearchRequest
from app.services.utilities.queries import query_exercises
from app.services.utilities.serializers import (
    to_exercise_document,
    to_exercise_search_result,
    to_muscle_group_public,
    to_muscle_group_search_result,
)

logger = logging.getLogger(__name__)


async def get_task(
    ms_client: AsyncClient,
    task_id: int,
):
    return await ms_client.get_task(task_id)


async def reindex(
    db_session: AsyncSession,
    ms_client: AsyncClient,
    wait_for_tasks: bool = False,
):
    logger.info("Starting reindexing")

    indexes = await ms_client.get_indexes() or []
    for idx in indexes:
        logger.info(f"Deleting index: {idx.uid}")
        await ms_client.delete_index_if_exists(idx.uid)

    task_id = await _index_muscle_groups(db_session, ms_client)
    logger.info(f"Reindexing muscle groups with task id: {task_id}")
    if wait_for_tasks:
        await ms_client.wait_for_task(task_id)

    task_id = await _index_exercises(db_session, ms_client)
    logger.info(f"Reindexing exercises with task id: {task_id}")
    if wait_for_tasks:
        await ms_client.wait_for_task(task_id)


async def _index_muscle_groups(
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> int:
    result = await db_session.execute(select(MuscleGroup))
    muscle_groups = result.scalars().all()
    docs = [to_muscle_group_public(mg) for mg in muscle_groups]

    settings = MeilisearchSettings(
        searchable_attributes=[
            "name",
            "description",
        ],
    )

    index = await ms_client.get_or_create_index(SearchIndex.MUSCLE_GROUPS)
    settings_task = await index.update_settings(settings)
    await ms_client.wait_for_task(settings_task.task_uid)

    task = await index.add_documents([doc.model_dump() for doc in docs])
    return task.task_uid


async def _index_exercises(
    db_session: AsyncSession,
    ms_client: AsyncClient,
) -> int:
    exercises = await query_exercises(db_session, base=False)
    docs = [to_exercise_document(e) for e in exercises]

    settings = MeilisearchSettings(
        searchable_attributes=[
            "name",
            "description",
            "muscle_group_names",
        ],
        filterable_attributes=[
            "user_id",
        ],
    )

    index = await ms_client.get_or_create_index(SearchIndex.EXERCISES)
    settings_task = await index.update_settings(settings)
    await ms_client.wait_for_task(settings_task.task_uid)

    task = await index.add_documents(
        [doc.model_dump() for doc in docs],
        primary_key="id",
    )
    return task.task_uid


async def index_exercise(
    exercise: Exercise,
    ms_client: AsyncClient,
) -> int:
    logger.info("Indexing exercise %s", exercise.id)

    index = await ms_client.get_or_create_index(SearchIndex.EXERCISES)
    task = await index.add_documents(
        [to_exercise_document(exercise).model_dump()],
        primary_key="id",
    )

    logger.info("Exercise index task %s created", task.task_uid)
    return task.task_uid


async def delete_indexed_exercise(
    exercise: Exercise,
    ms_client: AsyncClient,
) -> int:
    logger.info("Removing exercise %s from index", exercise.id)

    index = await ms_client.get_or_create_index(SearchIndex.EXERCISES)
    task = await index.delete_document(str(exercise.id))

    logger.info("Exercise delete task %s created", task.task_uid)
    return task.task_uid


async def search_muscle_groups(
    req: SearchRequest,
    ms_client: AsyncClient,
):
    logger.info(f"Searching muscle groups with query: '{req.query}'")
    results = await _search(
        model=MuscleGroupPublic,
        ms_client=ms_client,
        index=SearchIndex.MUSCLE_GROUPS,
        query=req.query,
        limit=req.limit,
    )
    return [to_muscle_group_search_result(hit) for hit in results.hits]


async def search_exercises(
    req: SearchRequest,
    user_id: int | None,
    ms_client: AsyncClient,
):
    logger.info(f"Searching exercises with query: '{req.query}' and user_id: {user_id}")
    results = await _search(
        model=ExerciseDocument,
        ms_client=ms_client,
        index=SearchIndex.EXERCISES,
        query=req.query,
        filter=f"user_id IS NULL OR user_id = {user_id}"
        if user_id is not None
        else None,
        limit=req.limit,
    )
    return [to_exercise_search_result(hit) for hit in results.hits]


async def _search[T](
    model: type[T],
    ms_client: AsyncClient,
    index: SearchIndex,
    query: str,
    filter: str | None = None,
    limit: int = 20,
) -> SearchResults[T]:
    logger.info(
        f"Performing search on index '{index}' with query: '{query}', filter: '{filter}', limit: {limit}"
    )
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
