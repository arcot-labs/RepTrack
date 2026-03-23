from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.services.muscle_group import get_muscle_groups_by_ids

from .utilities import get_muscle_group_id


async def test_get_muscle_groups_by_ids(session: AsyncSession):
    mg_1 = await get_muscle_group_id(session, name="biceps")
    mg_2 = await get_muscle_group_id(session, name="triceps")

    result = await get_muscle_groups_by_ids([mg_1, mg_2], session)

    assert len(result) == 2
    assert all(isinstance(muscle_group, MuscleGroup) for muscle_group in result)
    assert {muscle_group.id for muscle_group in result} == {mg_1, mg_2}


async def test_get_muscle_groups_by_ids_missing_ids(session: AsyncSession):
    mg = await get_muscle_group_id(session, name="biceps")

    result = await get_muscle_groups_by_ids([mg, 99999], session)

    assert len(result) == 1
    assert result[0].id == mg


async def test_get_muscle_groups_by_ids_empty(session: AsyncSession):
    result = await get_muscle_groups_by_ids([], session)

    assert result == []
