from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.set import CreateSetRequest, UpdateSetRequest
from app.models.schemas.user import UserPublic
from app.services.set import create_set, delete_set, update_set

api_router = APIRouter(
    prefix="/workouts/{workout_id}/exercises/{workout_exercise_id}/sets",
    tags=["Set"],
    dependencies=[Depends(get_current_user)],
)


@api_router.post(
    "",
    operation_id="createSet",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
        status.HTTP_409_CONFLICT: ErrorResponseModel,
    },
)
async def create_set_endpoint(
    workout_id: int,
    workout_exercise_id: int,
    req: CreateSetRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await create_set(workout_id, workout_exercise_id, user.id, req, db)


@api_router.patch(
    "/{set_id}",
    operation_id="updateSet",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def update_set_endpoint(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    req: UpdateSetRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await update_set(workout_id, workout_exercise_id, set_id, user.id, req, db)


@api_router.delete(
    "/{set_id}",
    operation_id="deleteSet",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def delete_set_endpoint(
    workout_id: int,
    workout_exercise_id: int,
    set_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await delete_set(workout_id, workout_exercise_id, set_id, user.id, db)
