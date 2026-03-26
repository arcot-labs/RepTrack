from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup


async def get_muscle_group_id(db_session: AsyncSession, name: str) -> int:
    result = await db_session.execute(
        select(MuscleGroup).where(MuscleGroup.name == name),
    )
    muscle_group = result.scalar_one()
    return muscle_group.id


async def create_muscle_group(
    db_session: AsyncSession,
    name: str,
    description: str,
) -> MuscleGroup:
    muscle_group = MuscleGroup(
        name=name,
        description=description,
    )
    db_session.add(muscle_group)
    await db_session.commit()
    await db_session.refresh(muscle_group)
    return muscle_group
