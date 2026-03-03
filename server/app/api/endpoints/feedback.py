from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_user, get_db
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.feedback import CreateFeedbackRequest
from app.models.schemas.user import UserPublic
from app.services.feedback import create_feedback
from app.services.github import GitHubService, get_github_service

api_router = APIRouter(
    prefix="/feedback", tags=["Feedback"], dependencies=[Depends(get_current_user)]
)


@api_router.post(
    "",
    operation_id="createFeedback",
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
def create_feedback_endpoint(
    user: Annotated[UserPublic, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    github_svc: Annotated[GitHubService, Depends(get_github_service)],
    settings: Annotated[Settings, Depends(get_settings)],
    req: CreateFeedbackRequest = Form(..., media_type="multipart/form-data"),
):
    background_tasks.add_task(
        create_feedback,
        user=user,
        req=req,
        db=db,
        github_svc=github_svc,
        settings=settings,
    )
