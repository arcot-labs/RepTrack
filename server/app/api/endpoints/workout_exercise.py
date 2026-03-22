from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.user import UserPublic
from app.models.schemas.workout_exercise import (
    CreateWorkoutExerciseRequest,
)
from app.services.workout_exercise import (
    create_workout_exercise,
    delete_workout_exercise,
)

api_router = APIRouter(
    prefix="/workout-exercises",
    tags=["Workout Exercise"],
    dependencies=[Depends(get_current_user)],
)


@api_router.post(
    "/{workout_id}/exercises",
    operation_id="createWorkoutExercise",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def create_workout_exercise_endpoint(
    workout_id: int,
    req: CreateWorkoutExerciseRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await create_workout_exercise(workout_id, user.id, req, db)


@api_router.delete(
    "/{workout_id}/exercises/{workout_exercise_id}",
    operation_id="deleteWorkoutExercise",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def delete_workout_exercise_endpoint(
    workout_id: int,
    workout_exercise_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await delete_workout_exercise(workout_id, workout_exercise_id, user.id, db)
