from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic


async def get_muscle_groups_ordered_by_name(
    db: AsyncSession,
) -> list[MuscleGroupPublic]:
    result = await db.execute(select(MuscleGroup).order_by(MuscleGroup.name.asc()))
    muscle_groups = result.scalars().all()
    return [
        MuscleGroupPublic.model_validate(mg, from_attributes=True)
        for mg in muscle_groups
    ]
