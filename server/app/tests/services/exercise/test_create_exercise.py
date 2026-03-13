import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import ExerciseNameConflict, MuscleGroupNotFound
from app.models.schemas.exercise import CreateExerciseRequest
from app.services.exercise import create_exercise

from .utilities import create_user, get_muscle_group_id


async def test_create_exercise(session: AsyncSession):
    user = await create_user(session)
    muscle_group_id = await get_muscle_group_id(session, name="chest")

    result = await create_exercise(
        user.id,
        CreateExerciseRequest(
            name="Incline Bench",
            description="Upper chest press",
            muscle_group_ids=[muscle_group_id],
        ),
        session,
    )

    assert result.user_id == user.id
    assert result.name == "Incline Bench"
    assert result.description == "Upper chest press"
    assert [muscle_group.id for muscle_group in result.muscle_groups] == [
        muscle_group_id
    ]


async def test_create_exercise_invalid_muscle_group(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(MuscleGroupNotFound):
        await create_exercise(
            user.id,
            CreateExerciseRequest(name="Bench", muscle_group_ids=[99999]),
            session,
        )


async def test_create_exercise_name_conflict(session: AsyncSession):
    user = await create_user(session)
    await create_exercise(
        user.id,
        CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
        session,
    )

    with pytest.raises(ExerciseNameConflict):
        await create_exercise(
            user.id,
            CreateExerciseRequest(name="Bench", muscle_group_ids=[]),
            session,
        )
