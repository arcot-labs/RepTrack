import logging

from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas.exercise import ExerciseSearchResult
from app.models.schemas.search import SearchRequest
from app.services.search import (
    _index_exercises,  # pyright: ignore[reportPrivateUsage]
    search_exercises,
)
from app.tests.api.utilities import create_user

from ..exercise.utilities import create_exercise
from ..muscle_group.utilities import create_muscle_group
from .utilities import wait_for_task

logger = logging.getLogger(__name__)


async def test_search_exercises(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    mg = await create_muscle_group(
        db_session,
        name="muscle group 1",
        description="Muscle group 1",
    )
    exercise = await create_exercise(
        db_session,
        name="exercise 1",
        description="Exercise 1",
        muscle_group_ids=[mg.id],
    )

    task = await _index_exercises(db_session, ms_client)
    await wait_for_task(ms_client, task)

    results = await search_exercises(
        SearchRequest(query="1", limit=10),
        user_id=None,
        ms_client=ms_client,
    )

    assert isinstance(results, list)
    assert len(results) == 1

    hit = results[0]
    ExerciseSearchResult.model_validate(hit)
    assert hit.id == exercise.id


async def test_search_exercises_user_filter(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    user_1 = await create_user(db_session, username="user1")
    user_2 = await create_user(db_session, username="user2")

    exercise_1 = await create_exercise(
        db_session,
        name="exercise 1",
        description="Exercise 1",
        user_id=user_1.id,
    )
    await create_exercise(
        db_session,
        name="exercise 2",
        description="Exercise 2",
        user_id=user_2.id,
    )

    task = await _index_exercises(db_session, ms_client)
    await wait_for_task(ms_client, task)

    results = await search_exercises(
        SearchRequest(query="exercise", limit=10),
        user_id=user_1.id,
        ms_client=ms_client,
    )

    assert isinstance(results, list)
    assert len(results) == 1

    hit = results[0]
    ExerciseSearchResult.model_validate(hit)
    assert hit.id == exercise_1.id


async def test_search_exercises_limit(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    for i in range(5):
        await create_exercise(
            db_session,
            name=f"exercise {i}",
            description=f"Exercise {i}",
        )

    task = await _index_exercises(db_session, ms_client)
    await wait_for_task(ms_client, task)

    results = await search_exercises(
        SearchRequest(query="exercise", limit=3),
        user_id=None,
        ms_client=ms_client,
    )

    assert isinstance(results, list)
    assert len(results) == 3
