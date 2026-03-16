from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.services.muscle_group import get_muscle_groups_by_ids


async def test_get_muscle_groups_by_ids(session: AsyncSession):
    result = await get_muscle_groups_by_ids([7, 8], session)

    assert len(result) == 2
    assert all(isinstance(muscle_group, MuscleGroup) for muscle_group in result)
    assert {muscle_group.id for muscle_group in result} == {7, 8}


async def test_get_muscle_groups_by_ids_missing_ids(session: AsyncSession):
    result = await get_muscle_groups_by_ids([1, 99999], session)

    assert len(result) == 1
    assert result[0].id == 1


async def test_get_muscle_groups_by_ids_empty(session: AsyncSession):
    result = await get_muscle_groups_by_ids([], session)

    assert result == []
