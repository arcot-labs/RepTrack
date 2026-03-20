from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.exercise import ExercisePublic
from app.services.exercise import (
    _get_exercises_with_muscle_groups,  # pyright: ignore[reportPrivateUsage]
    to_exercise_public,
)

from ..utilities import HttpMethod, make_http_request


async def get_muscle_group_id(session: AsyncSession, name: str) -> int:
    result = await session.execute(
        select(MuscleGroup).where(MuscleGroup.name == name),
    )
    muscle_group = result.scalar_one()
    return muscle_group.id


async def create_exercise_via_api(
    client: AsyncClient,
    session: AsyncSession,
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
    exercises = await _get_exercises_with_muscle_groups(
        session,
        Exercise.name == name,
    )
    return to_exercise_public(exercises[0])


async def create_system_exercise(
    session: AsyncSession,
    name: str,
    description: str | None = None,
) -> Exercise:
    return await create_exercise(
        session,
        name=name,
        description=description,
    )


async def create_exercise(
    session: AsyncSession,
    name: str,
    description: str | None = None,
    user_id: int | None = None,
) -> Exercise:
    exercise = Exercise(user_id=user_id, name=name, description=description)
    session.add(exercise)
    await session.commit()
    return exercise
