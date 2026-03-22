from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.user import UserPublic
from app.models.schemas.workout import (
    CreateWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutBase,
    WorkoutPublic,
)
from app.services.workout import (
    create_workout,
    delete_workout,
    get_workout,
    get_workouts,
    update_workout,
)

api_router = APIRouter(
    prefix="/workouts",
    tags=["Workout"],
    dependencies=[Depends(get_current_user)],
)


@api_router.post(
    "",
    operation_id="createWorkout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def create_workout_endpoint(
    req: CreateWorkoutRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await create_workout(user.id, req, db)


@api_router.get(
    "",
    operation_id="getWorkouts",
    responses={status.HTTP_401_UNAUTHORIZED: ErrorResponseModel},
)
async def get_workouts_endpoint(
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[WorkoutBase]:
    return await get_workouts(user.id, db)


@api_router.get(
    "/{workout_id}",
    operation_id="getWorkout",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def get_workout_endpoint(
    workout_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> WorkoutPublic:
    return await get_workout(workout_id, user.id, db)


@api_router.patch(
    "/{workout_id}",
    operation_id="updateWorkout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def update_workout_endpoint(
    workout_id: int,
    req: UpdateWorkoutRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await update_workout(workout_id, user.id, req, db)


@api_router.delete(
    "/{workout_id}",
    operation_id="deleteWorkout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def delete_workout_endpoint(
    workout_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await delete_workout(workout_id, user.id, db)
