import pytest
from sqlalchemy.exc import MissingGreenlet
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.exercise import (
    select_exercise_by_id,
)

from ...exercise.utilities import create_exercise


async def test_select_exercise_by_id(db_session: AsyncSession):
    created = await create_exercise(db_session, "by-id@example.com")
    await db_session.commit()

    result = await select_exercise_by_id(db_session, created.id)

    assert result is not None
    assert result.id == created.id
    assert result.user_id == created.user_id
    assert result.name == created.name
    assert result.description == created.description
    assert result.created_at == created.created_at
    assert result.updated_at == created.updated_at

    with pytest.raises(MissingGreenlet):
        _ = result.muscle_groups


async def test_select_exercise_by_id_not_found(db_session: AsyncSession):
    result = await select_exercise_by_id(db_session, 999999)

    assert result is None
