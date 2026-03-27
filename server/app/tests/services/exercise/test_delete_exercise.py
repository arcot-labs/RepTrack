import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.errors import ExerciseNotFound
from app.services.exercise import delete_exercise

from ..muscle_group.utilities import get_muscle_group_id
from ..utilities import create_user
from .utilities import create_exercise


async def test_delete_exercise(db_session: AsyncSession):
    user = await create_user(db_session)
    mg_id = await get_muscle_group_id(db_session, name="chest")
    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
        muscle_group_ids=[mg_id],
    )

    await delete_exercise(exercise.id, user.id, db_session)

    exercises = await db_session.execute(
        select(Exercise).where(Exercise.id == exercise.id),
    )
    assert exercises.scalar_one_or_none() is None

    emgs = await db_session.execute(
        select(ExerciseMuscleGroup).where(
            ExerciseMuscleGroup.exercise_id == exercise.id,
        ),
    )
    assert emgs.scalars().all() == []


async def test_delete_exercise_not_found(db_session: AsyncSession):
    user = await create_user(db_session)

    with pytest.raises(ExerciseNotFound):
        await delete_exercise(99999, user.id, db_session)


async def test_delete_exercise_not_allowed(db_session: AsyncSession):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")

    exercise = await create_exercise(
        db_session,
        name="Bench",
        user_id=user.id,
    )

    with pytest.raises(ExerciseNotFound):
        await delete_exercise(exercise.id, user_2.id, db_session)
