import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.errors import ExerciseNotFound
from app.services.exercise import delete_exercise

from ..utilities import create_user
from .utilities import create_exercise, get_muscle_group_id


async def test_delete_exercise(session: AsyncSession):
    user = await create_user(session)
    mg_id = await get_muscle_group_id(session, name="chest")
    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
        muscle_group_ids=[mg_id],
    )

    await delete_exercise(exercise.id, user.id, session)

    exercises = await session.execute(
        select(Exercise).where(Exercise.id == exercise.id),
    )
    assert exercises.scalar_one_or_none() is None

    emgs = await session.execute(
        select(ExerciseMuscleGroup).where(
            ExerciseMuscleGroup.exercise_id == exercise.id,
        ),
    )
    assert emgs.scalars().all() == []


async def test_delete_exercise_not_found(session: AsyncSession):
    user = await create_user(session)

    with pytest.raises(ExerciseNotFound):
        await delete_exercise(99999, user.id, session)


async def test_delete_exercise_not_allowed(session: AsyncSession):
    user = await create_user(session)
    user_2 = await create_user(session, username="user_2")

    exercise = await create_exercise(
        session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNotFound):
        await delete_exercise(exercise.id, user_2.id, session)
