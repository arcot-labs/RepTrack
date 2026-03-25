from datetime import datetime
from unittest.mock import AsyncMock

import pytest
from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.access_request import AccessRequest
from app.models.database.registration_token import RegistrationToken
from app.models.enums import AccessRequestStatus
from app.models.errors import AccessRequestNotFound, AccessRequestNotPending
from app.services.admin import update_access_request_status

from ..utilities import get_admin_user_public


async def test_update_access_request_status_approved(
    db_session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(access_request)
    await db_session.commit()

    admin_user = await get_admin_user_public(db_session, settings)
    background_tasks = BackgroundTasks()

    await update_access_request_status(
        access_request_id=access_request.id,
        status=AccessRequestStatus.APPROVED,
        db=db_session,
        user=admin_user,
        background_tasks=background_tasks,
        email_svc=mock_email_svc,
        settings=settings,
    )

    await db_session.refresh(access_request)

    assert access_request.status == AccessRequestStatus.APPROVED
    assert isinstance(access_request.reviewed_at, datetime)
    assert access_request.reviewed_by == admin_user.id

    tokens = (
        (
            await db_session.execute(
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


async def test_update_access_request_status_rejected(
    db_session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="pending2@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(access_request)
    await db_session.commit()

    admin_user = await get_admin_user_public(db_session, settings)
    background_tasks = BackgroundTasks()

    await update_access_request_status(
        access_request_id=access_request.id,
        status=AccessRequestStatus.REJECTED,
        db=db_session,
        user=admin_user,
        background_tasks=background_tasks,
        email_svc=mock_email_svc,
        settings=settings,
    )

    await db_session.refresh(access_request)
    assert access_request.status == AccessRequestStatus.REJECTED

    tokens = (
        (
            await db_session.execute(
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


async def test_update_access_request_status_not_found(
    db_session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    with pytest.raises(AccessRequestNotFound):
        await update_access_request_status(
            access_request_id=9999,
            status=AccessRequestStatus.APPROVED,
            db=db_session,
            user=await get_admin_user_public(db_session, settings),
            background_tasks=BackgroundTasks(),
            email_svc=mock_email_svc,
            settings=settings,
        )


async def test_update_access_request_status_not_pending(
    db_session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.commit()

    with pytest.raises(AccessRequestNotPending):
        await update_access_request_status(
            access_request_id=access_request.id,
            status=AccessRequestStatus.REJECTED,
            db=db_session,
            user=await get_admin_user_public(db_session, settings),
            background_tasks=BackgroundTasks(),
            email_svc=mock_email_svc,
            settings=settings,
        )
