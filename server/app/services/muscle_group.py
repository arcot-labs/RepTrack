from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.utilities.serializers import to_muscle_group_public


async def get_muscle_groups_ordered_by_name(
    db_session: AsyncSession,
) -> list[MuscleGroupPublic]:
    result = await db_session.execute(
        select(MuscleGroup).order_by(MuscleGroup.name.asc())
    )
    muscle_groups = result.scalars().all()
    return [to_muscle_group_public(mg) for mg in muscle_groups]


async def get_muscle_groups_by_ids(
    ids: list[int],
    db_session: AsyncSession,
) -> list[MuscleGroup]:
    if not ids:
        return []
    result = await db_session.execute(
        select(MuscleGroup).where(MuscleGroup.id.in_(ids)),
    )
    return list(result.scalars().all())
