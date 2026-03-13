from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.user import UserPublic

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
