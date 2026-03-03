from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.dependencies import get_db, refresh_token_cookie
from app.core.security import ACCESS_JWT_KEY, REFRESH_JWT_KEY
from app.models.api import (
    REQUEST_ACCESS_APPROVED_MESSAGE,
    REQUEST_ACCESS_CREATED_MESSAGE,
)
from app.models.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RequestAccessRequest,
    ResetPasswordRequest,
)
from app.models.schemas.errors import ErrorResponseModel
from app.services.auth import (
    login,
    refresh,
    register,
    request_access,
    request_password_reset,
    reset_password,
)
from app.services.email import EmailService, get_email_service

api_router = APIRouter(prefix="/auth", tags=["Auth"])


@api_router.post(
    "/request-access",
    operation_id="requestAccess",
    responses={
        status.HTTP_403_FORBIDDEN: ErrorResponseModel,
        status.HTTP_409_CONFLICT: ErrorResponseModel,
    },
)
async def request_access_endpoint(
    req: RequestAccessRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    email_svc: Annotated[EmailService, Depends(get_email_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> str:
    already_approved = await request_access(
        first_name=req.first_name,
        last_name=req.last_name,
        email_svc=email_svc,
        background_tasks=background_tasks,
        db=db,
        email=req.email,
        settings=settings,
    )
    if already_approved:
        return REQUEST_ACCESS_APPROVED_MESSAGE
    return REQUEST_ACCESS_CREATED_MESSAGE


@api_router.post(
    "/register",
    operation_id="register",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: ErrorResponseModel,
        status.HTTP_409_CONFLICT: ErrorResponseModel,
    },
)
async def register_endpoint(
    req: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await register(
        token_str=req.token,
        username=req.username,
        password=req.password,
        db=db,
    )


@api_router.post(
    "/forgot-password",
    operation_id="forgotPassword",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def forgot_password_endpoint(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    email_svc: Annotated[EmailService, Depends(get_email_service)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    await request_password_reset(
        email=req.email,
        background_tasks=background_tasks,
        db=db,
        email_svc=email_svc,
        settings=settings,
    )


@api_router.post(
    "/reset-password",
    operation_id="resetPassword",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_400_BAD_REQUEST: ErrorResponseModel,
    },
)
async def reset_password_endpoint(
    req: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await reset_password(
        token_str=req.token,
        password=req.password,
        db=db,
    )


@api_router.post(
    "/login",
    operation_id="login",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def login_endpoint(
    req: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    res: Response,
):
    result = await login(
        username=req.username, password=req.password, db=db, settings=settings
    )
    res.set_cookie(
        key=ACCESS_JWT_KEY,
        value=result.access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        max_age=60 * 60,  # 1 hour
    )
    res.set_cookie(
        key=REFRESH_JWT_KEY,
        value=result.refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        max_age=60 * 60 * 24 * 365,  # 1 year
    )


@api_router.post(
    "/refresh-token",
    operation_id="refreshToken",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        status.HTTP_401_UNAUTHORIZED: ErrorResponseModel,
    },
)
async def refresh_token_endpoint(
    db: Annotated[AsyncSession, Depends(get_db)],
    refresh_token: Annotated[str, Depends(refresh_token_cookie)],
    settings: Annotated[Settings, Depends(get_settings)],
    res: Response,
):
    access_token = await refresh(db=db, token=refresh_token, settings=settings)
    res.set_cookie(
        key=ACCESS_JWT_KEY,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        max_age=60 * 60,  # 1 hour
    )


@api_router.post(
    "/logout",
    operation_id="logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout_endpoint(
    settings: Annotated[Settings, Depends(get_settings)],
    res: Response,
):
    res.delete_cookie(
        key=ACCESS_JWT_KEY,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
    )
    res.delete_cookie(
        key=REFRESH_JWT_KEY,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
    )
