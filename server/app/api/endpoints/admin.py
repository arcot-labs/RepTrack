from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_current_admin, get_db
from app.models.schemas.access_request import (
    AccessRequestPublic,
    UpdateAccessRequestStatusRequest,
)
from app.models.schemas.errors import ErrorResponseModel
from app.models.schemas.user import UserPublic
from app.services.admin import (
    get_access_requests,
    get_users,
    update_access_request_status,
)
from app.services.email import EmailService, get_email_service

api_router = APIRouter(
    prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)]
)


@api_router.get(
    "/access-requests",
    operation_id="getAccessRequests",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
    },
)
async def get_access_requests_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AccessRequestPublic]:
    return await get_access_requests(db)


@api_router.patch(
    "/access-requests/{access_request_id}",
    operation_id="updateAccessRequestStatus",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: ErrorResponseModel,
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
        status.HTTP_404_NOT_FOUND: ErrorResponseModel,
    },
)
async def update_access_request_status_endpoint(
    access_request_id: int,
    req: UpdateAccessRequestStatusRequest,
    user: Annotated[UserPublic, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    background_tasks: BackgroundTasks,
    email_svc: Annotated[EmailService, Depends(get_email_service)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    await update_access_request_status(
        access_request_id=access_request_id,
        status=req.status,
        user=user,
        db=db,
        background_tasks=background_tasks,
        email_svc=email_svc,
        settings=settings,
    )


@api_router.get(
    "/users",
    operation_id="getUsers",
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
    },
)
async def get_users_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[UserPublic]:
    return await get_users(db)
