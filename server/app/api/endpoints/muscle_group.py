from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.muscle_group import get_muscle_groups_ordered_by_name

api_router = APIRouter(
    prefix="/muscle-groups",
    tags=["Muscle Groups"],
    dependencies=[Depends(get_current_user)],
)


@api_router.get(
    "",
    operation_id="getMuscleGroups",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def get_muscle_groups_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[MuscleGroupPublic]:
    return await get_muscle_groups_ordered_by_name(db)
