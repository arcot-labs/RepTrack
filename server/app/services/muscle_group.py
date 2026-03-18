from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic


def to_muscle_group_public(muscle_group: MuscleGroup) -> MuscleGroupPublic:
    return MuscleGroupPublic.model_validate(muscle_group, from_attributes=True)


async def get_muscle_groups_ordered_by_name(
    db: AsyncSession,
) -> list[MuscleGroupPublic]:
    result = await db.execute(select(MuscleGroup).order_by(MuscleGroup.name.asc()))
    muscle_groups = result.scalars().all()
    return [to_muscle_group_public(mg) for mg in muscle_groups]


async def get_muscle_groups_by_ids(
    ids: list[int],
    db: AsyncSession,
) -> list[MuscleGroup]:
    if not ids:
        return []
    result = await db.execute(
        select(MuscleGroup).where(MuscleGroup.id.in_(ids)),
    )
    return list(result.scalars().all())
