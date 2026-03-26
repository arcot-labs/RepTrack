from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin, get_current_user, get_db_session
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.user import UserPublic
from app.services.user import get_users

api_router = APIRouter(
    prefix="/users",
    tags=["User"],
    dependencies=[Depends(get_current_user)],
)


@api_router.get(
    "/current",
    operation_id="getCurrentUser",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
def get_current_user_endpoint(
    user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    return user


@api_router.get(
    "",
    operation_id="getUsers",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
    },
)
async def get_users_endpoint(
    _: Annotated[UserPublic, Depends(get_current_admin)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[UserPublic]:
    return await get_users(db_session)
