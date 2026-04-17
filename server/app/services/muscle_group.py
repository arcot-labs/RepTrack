from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.queries.muscle_group import select_muscle_groups
from app.services.utilities.serializers import to_muscle_group_public


async def get_muscle_groups(
    db_session: AsyncSession,
) -> list[MuscleGroupPublic]:
    result = await select_muscle_groups(db_session, order=True)
    return [to_muscle_group_public(mg) for mg in result]
