from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.services.muscle_group import select_muscle_groups


async def test_select_muscle_groups(db_session: AsyncSession):
    result = await select_muscle_groups(db_session)
    item = next(r for r in result if r.name == "chest")

    assert item is not None
    assert isinstance(item, MuscleGroup)
    assert item.name == "chest"
    assert "pushing and pressing" in item.description


async def test_select_muscle_groups_ordering(db_session: AsyncSession):
    result = await select_muscle_groups(db_session, True)

    names = [mg.name for mg in result]
    # case-insensitive sorting to match db
    assert names == sorted(names, key=str.lower)
    assert names[0] == "abductors"
    assert names[-1] == "upper traps"
