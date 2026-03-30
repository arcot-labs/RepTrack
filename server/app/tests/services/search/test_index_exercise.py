from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.enums import SearchIndex
from app.models.schemas.exercise import ExerciseDocument
from app.services.search import index_exercise
from app.services.utilities.queries import query_exercises

from ..exercise.utilities import create_exercise
from ..muscle_group.utilities import create_muscle_group
from .utilities import wait_for_task


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

    exercises = await query_exercises(db_session, False, Exercise.id == exercise.id)
    exercise = exercises[0]
    assert exercise is not None

    task = await index_exercise(exercise, ms_client)
    await wait_for_task(ms_client, task)

    index = await ms_client.get_index(SearchIndex.EXERCISES)
    doc = await index.get_document(str(exercise.id))

    ExerciseDocument.model_validate(doc)
    assert doc["id"] == exercise.id
    assert doc["user_id"] == exercise.user_id
    assert doc["name"] == exercise.name
    assert doc["description"] == exercise.description
    assert doc["muscle_group_names"] == [mg.name]
