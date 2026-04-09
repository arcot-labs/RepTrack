from typing import Annotated

from fastapi import APIRouter, Depends, status
from meilisearch_python_sdk import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db_session, get_ms_client
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.exercise import (
    CreateExerciseRequest,
    ExercisePublic,
    UpdateExerciseRequest,
)
from app.models.schemas.user import UserPublic
from app.services.exercise import (
    create_exercise,
    delete_exercise,
    get_exercise,
    get_exercises,
    update_exercise,
)

api_router = APIRouter(
    prefix="/exercises",
    tags=["Exercise"],
    dependencies=[Depends(get_current_user)],
)


@api_router.post(
    "",
    operation_id="createExercise",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
        status.HTTP_409_CONFLICT: ErrorResponseModel,
    },
)
async def create_exercise_endpoint(
    req: CreateExerciseRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
):
    await create_exercise(user.id, req, db_session, ms_client)


@api_router.get(
    "",
    operation_id="getExercises",
    responses={status.HTTP_401_UNAUTHORIZED: ErrorResponseModel},
)
async def get_exercises_endpoint(
    user: Annotated[UserPublic, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ExercisePublic]:
    return await get_exercises(user.id, db_session)


@api_router.get(
    "/{exercise_id}",
    operation_id="getExercise",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def get_exercise_endpoint(
    exercise_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ExercisePublic:
    return await get_exercise(exercise_id, user.id, db_session)


@api_router.patch(
    "/{exercise_id}",
    operation_id="updateExercise",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
        status.HTTP_409_CONFLICT: ErrorResponseModel,
    },
)
async def update_exercise_endpoint(
    exercise_id: int,
    req: UpdateExerciseRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
):
    await update_exercise(exercise_id, user.id, req, db_session, ms_client)


@api_router.delete(
    "/{exercise_id}",
    operation_id="deleteExercise",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def delete_exercise_endpoint(
    exercise_id: int,
    user: Annotated[UserPublic, Depends(get_current_user)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
):
    await delete_exercise(exercise_id, user.id, db_session, ms_client)
