from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup


async def create_exercise(
    db_session: AsyncSession,
    name: str,
    user_id: int | None = None,
    description: str | None = None,
    muscle_group_ids: list[int] | None = None,
) -> Exercise:
    exercise = Exercise(
        user_id=user_id,
        name=name,
        description=description,
    )
    db_session.add(exercise)
    await db_session.flush()

    for muscle_group_id in muscle_group_ids or []:
        db_session.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=muscle_group_id,
            )
        )

    await db_session.commit()
    return exercise


def patch_index_exercise(
    monkeypatch: pytest.MonkeyPatch,
    return_value: int = 1,
):
    mocked_index_exercise = AsyncMock(return_value=return_value)
    monkeypatch.setattr("app.services.exercise._index_exercise", mocked_index_exercise)
    return mocked_index_exercise
