import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.workout import (
    select_workout_by_id,
)

from ...workout.utilities import create_workout


async def test_select_workout_by_id(db_session: AsyncSession):
    created = await create_workout(
        db_session,
        user_id=1,
    )
    await db_session.commit()

    result = await select_workout_by_id(db_session, created.id)

    assert result is not None
    assert result.id == created.id
    assert result.user_id == created.user_id
    assert result.started_at == created.started_at
    assert result.ended_at == created.ended_at
    assert result.notes == created.notes
    assert result.created_at == created.created_at
    assert result.updated_at == created.updated_at

    with pytest.raises(MissingGreenlet):
        _ = result.exercises


async def test_select_workout_by_id_not_found(db_session: AsyncSession):
    result = await select_workout_by_id(db_session, 999999)

    assert result is None
