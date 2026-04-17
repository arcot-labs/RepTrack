from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup


async def select_muscle_groups_by_ids(
    db_session: AsyncSession,
    ids: list[int],
) -> list[MuscleGroup]:
    if not ids:
        return []
    result = await db_session.execute(
        select(MuscleGroup).where(MuscleGroup.id.in_(ids)),
    )
    return list(result.scalars().all())


async def select_muscle_groups(
    db_session: AsyncSession,
    order: bool = False,
) -> list[MuscleGroup]:
    query = select(MuscleGroup)
    if order:
        query = query.order_by(MuscleGroup.name.asc())
    result = await db_session.execute(query)
    return list(result.scalars().all())
