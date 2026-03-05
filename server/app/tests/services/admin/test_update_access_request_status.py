from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.access_request import AccessRequest
from app.models.database.registration_token import RegistrationToken
from app.models.database.user import User
from app.models.enums import AccessRequestStatus
from app.models.errors import AccessRequestStatusError, NotFound
from app.models.schemas.user import UserPublic
from app.services.admin import update_access_request_status


async def _get_admin_user_public(
    session: AsyncSession, settings: Settings
) -> UserPublic:
    result = await session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    admin = result.scalar_one()

    return UserPublic.model_validate(admin, from_attributes=True)


async def test_update_access_request_status_raises_not_found(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    with pytest.raises(NotFound):
        await update_access_request_status(
            access_request_id=9999,
            status=AccessRequestStatus.APPROVED,
            db=session,
            user=await _get_admin_user_public(session, settings),
            background_tasks=BackgroundTasks(),
            email_svc=mock_email_svc,
            settings=settings,
        )


async def test_update_access_request_status_raises_access_request_status_error(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.commit()

    with pytest.raises(AccessRequestStatusError):
        await update_access_request_status(
            access_request_id=access_request.id,
            status=AccessRequestStatus.REJECTED,
            db=session,
            user=await _get_admin_user_public(session, settings),
            background_tasks=BackgroundTasks(),
            email_svc=mock_email_svc,
            settings=settings,
        )


async def test_update_access_request_status_approved_updates_request_and_schedules_email(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    session.add(access_request)
    await session.commit()

    admin_user = await _get_admin_user_public(session, settings)
    background_tasks = BackgroundTasks()

    await update_access_request_status(
        access_request_id=access_request.id,
        status=AccessRequestStatus.APPROVED,
        db=session,
        user=admin_user,
        background_tasks=background_tasks,
        email_svc=mock_email_svc,
        settings=settings,
    )

    await session.refresh(access_request)

    assert access_request.status == AccessRequestStatus.APPROVED
    assert isinstance(access_request.reviewed_at, datetime)
    assert access_request.reviewed_by == admin_user.id

    tokens = (
        (
            await session.execute(
                select(RegistrationToken).where(
                    RegistrationToken.access_request_id == access_request.id
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(tokens) == 1

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_approved_email
    assert task.args[0] == settings
    assert task.args[1] == access_request
    assert isinstance(task.args[2], str)


async def test_update_access_request_status_rejected_schedules_rejection_email(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="pending2@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    session.add(access_request)
    await session.commit()

    admin_user = await _get_admin_user_public(session, settings)
    background_tasks = BackgroundTasks()

    await update_access_request_status(
        access_request_id=access_request.id,
        status=AccessRequestStatus.REJECTED,
        db=session,
        user=admin_user,
        background_tasks=background_tasks,
        email_svc=mock_email_svc,
        settings=settings,
    )

    await session.refresh(access_request)
    assert access_request.status == AccessRequestStatus.REJECTED

    tokens = (
        (
            await session.execute(
                select(RegistrationToken).where(
                    RegistrationToken.access_request_id == access_request.id
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(tokens) == 0

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_rejected_email
    assert task.args[0] == settings
    assert task.args[1] == access_request
