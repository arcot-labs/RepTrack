from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.muscle_group import get_muscle_groups_ordered_by_name


async def _create_muscle_group(
    session: AsyncSession,
    *,
    name: str,
    description: str = "A muscle group",
) -> MuscleGroup:
    mg = MuscleGroup(name=name, description=description)
    session.add(mg)
    await session.commit()
    return mg


async def test_get_muscle_groups_ordered_by_name(session: AsyncSession):
    mg = await _create_muscle_group(session, name="Quads", description="Front of thigh")

    result = await get_muscle_groups_ordered_by_name(session)
    item = next(r for r in result if r.id == mg.id)

    assert item is not None
    assert isinstance(item, MuscleGroupPublic)
    assert item.name == "Quads"
    assert item.description == "Front of thigh"


async def test_get_muscle_groups_ordered_by_name_ordering(session: AsyncSession):
    await _create_muscle_group(session, name="Triceps")
    await _create_muscle_group(session, name="Biceps")

    result = await get_muscle_groups_ordered_by_name(session)

    names = [mg.name for mg in result]
    # case-insensitive sorting to match db
    assert names == sorted(names, key=str.lower)
    triceps_index = names.index("Triceps")
    biceps_index = names.index("Biceps")
    assert biceps_index < triceps_index


async def test_read_only(session: AsyncSession):
    before_count = await session.scalar(select(func.count()).select_from(MuscleGroup))

    await get_muscle_groups_ordered_by_name(session)

    after_count = await session.scalar(select(func.count()).select_from(MuscleGroup))
    assert before_count == after_count
