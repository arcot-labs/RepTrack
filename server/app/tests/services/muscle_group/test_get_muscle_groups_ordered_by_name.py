from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.muscle_group import get_muscle_groups_ordered_by_name


async def test_get_muscle_groups_ordered_by_name(session: AsyncSession):
    result = await get_muscle_groups_ordered_by_name(session)
    item = next(r for r in result if r.name == "chest")

    assert item is not None
    assert isinstance(item, MuscleGroupPublic)
    assert item.name == "chest"
    assert "upper torso" in item.description


async def test_get_muscle_groups_ordered_by_name_ordering(session: AsyncSession):
    result = await get_muscle_groups_ordered_by_name(session)

    names = [mg.name for mg in result]
    # case-insensitive sorting to match db
    assert names == sorted(names, key=str.lower)
    assert names[0] == "arms"
    assert names[-1] == "shoulders"


async def test_read_only(session: AsyncSession):
    before_count = await session.scalar(select(func.count()).select_from(MuscleGroup))

    await get_muscle_groups_ordered_by_name(session)

    after_count = await session.scalar(select(func.count()).select_from(MuscleGroup))
    assert before_count == after_count
