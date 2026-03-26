from typing import Annotated

from fastapi import APIRouter, Depends, status
from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.models.search import SearchResults
from meilisearch_python_sdk.models.task import TaskResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import (
    get_current_admin,
    get_current_user,
    get_db_session,
    get_ms_client,
)
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.exercise import ExerciseDocument
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.models.schemas.search import SearchRequest
from app.models.schemas.user import UserPublic
from app.services.search import (
    get_task,
    reindex,
    search_exercises,
    search_muscle_groups,
)

api_router = APIRouter(
    prefix="/search",
    tags=["Search"],
    dependencies=[Depends(get_current_user)],
)


@api_router.get(
    "/tasks/{task_id}",
    operation_id="getTask",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
    },
)
async def get_task_endpoint(
    task_id: int,
    _: Annotated[UserPublic, Depends(get_current_admin)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
) -> TaskResult:
    return await get_task(ms_client, task_id)


@api_router.post(
    "/reindex",
    operation_id="reindex",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
    },
)
async def reindex_endpoint(
    _: Annotated[UserPublic, Depends(get_current_admin)],
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
):
    await reindex(
        db_session=db_session,
        ms_client=ms_client,
    )


@api_router.post(
    "/muscle-groups",
    operation_id="searchMuscleGroups",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def search_muscle_groups_endpoint(
    req: SearchRequest,
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
) -> SearchResults[MuscleGroupPublic]:
    return await search_muscle_groups(
        req=req,
        ms_client=ms_client,
    )


@api_router.post(
    "/exercises",
    operation_id="searchExercises",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def search_exercises_endpoint(
    req: SearchRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
    ms_client: Annotated[AsyncClient, Depends(get_ms_client)],
) -> SearchResults[ExerciseDocument]:
    return await search_exercises(
        req=req,
        user_id=user.id,
        ms_client=ms_client,
    )
