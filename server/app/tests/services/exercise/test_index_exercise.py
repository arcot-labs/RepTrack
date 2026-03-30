import pytest
from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.enums import SearchIndex
from app.models.errors import ExerciseNotFound
from app.models.schemas.exercise import ExerciseDocument
from app.services.exercise import (
    _index_exercise,  # pyright: ignore[reportPrivateUsage]
)

from ..exercise.utilities import create_exercise
from ..muscle_group.utilities import create_muscle_group
from ..search.utilities import wait_for_task


async def test_index_exercise(
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

    task = await _index_exercise(exercise, db_session, ms_client)
    await wait_for_task(ms_client, task)

    index = await ms_client.get_index(SearchIndex.EXERCISES)
    doc = await index.get_document(str(exercise.id))

    ExerciseDocument.model_validate(doc)
    assert doc["id"] == exercise.id


async def test_index_exercise_not_found(
    db_session: AsyncSession,
    ms_client: AsyncClient,
):
    exercise = Exercise(
        id=99999,
        user_id=99999,
        name="Nonexistent Exercise",
    )

    with pytest.raises(ExerciseNotFound):
        await _index_exercise(exercise, db_session, ms_client)
