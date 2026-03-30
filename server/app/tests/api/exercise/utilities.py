from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.exercise import ExercisePublic
from app.services.utilities.queries import query_exercises
from app.services.utilities.serializers import to_exercise_public

from ..utilities import HttpMethod, make_http_request


async def get_muscle_group_id(db_session: AsyncSession, name: str) -> int:
    result = await db_session.execute(
        select(MuscleGroup).where(MuscleGroup.name == name),
    )
    muscle_group = result.scalar_one()
    return muscle_group.id


async def create_exercise_via_api(
    client: AsyncClient,
    db_session: AsyncSession,
    name: str,
    description: str | None = None,
    muscle_group_ids: list[int] | None = None,
) -> ExercisePublic:
    await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/exercises",
        json={
            "name": name,
            "description": description,
            "muscle_group_ids": muscle_group_ids or [],
        },
    )
    exercises = await query_exercises(
        db_session,
        False,
        Exercise.name == name,
    )
    return to_exercise_public(exercises[0])


async def create_system_exercise(
    db_session: AsyncSession,
    name: str,
    description: str | None = None,
) -> Exercise:
    return await create_exercise(
        db_session,
        name=name,
        description=description,
    )


async def create_exercise(
    db_session: AsyncSession,
    name: str,
    description: str | None = None,
    user_id: int | None = None,
) -> Exercise:
    exercise = Exercise(user_id=user_id, name=name, description=description)
    db_session.add(exercise)
    await db_session.commit()
    return exercise


def patch_index_exercise(
    monkeypatch: pytest.MonkeyPatch,
    return_value: int = 1,
):
    mocked_index_exercise = AsyncMock(return_value=return_value)
    monkeypatch.setattr("app.services.exercise._index_exercise", mocked_index_exercise)
    return mocked_index_exercise


def patch_delete_indexed_exercise(
    monkeypatch: pytest.MonkeyPatch,
):
    mocked_delete_indexed_exercise = AsyncMock()
    monkeypatch.setattr(
        "app.services.exercise.delete_indexed_exercise", mocked_delete_indexed_exercise
    )
    return mocked_delete_indexed_exercise
