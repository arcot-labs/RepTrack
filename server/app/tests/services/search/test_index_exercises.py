from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SearchIndex
from app.models.schemas.exercise import ExerciseDocument
from app.services.search import _index_exercises  # pyright: ignore[reportPrivateUsage]

from ..exercise.utilities import create_exercise
from ..muscle_group.utilities import create_muscle_group
from .utilities import wait_for_task


async def test_index_exercises(
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

    index = await ms_client.get_or_create_index(SearchIndex.EXERCISES)
    doc = await index.get_document(str(exercise.id))

    ExerciseDocument.model_validate(doc)
    assert doc["id"] == exercise.id
    assert doc["user_id"] == exercise.user_id
    assert doc["name"] == exercise.name
    assert doc["description"] == exercise.description
    assert doc["muscle_group_names"] == [mg.name]
