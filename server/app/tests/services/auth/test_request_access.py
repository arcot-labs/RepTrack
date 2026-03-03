from unittest.mock import AsyncMock

import pytest
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.user import User
from app.models.errors import (
    AccessRequestPending,
    AccessRequestRejected,
    EmailAlreadyRegistered,
)
from app.services.auth import request_access


async def test_request_access(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    new_email = "newuser@example.com"
    background_tasks = BackgroundTasks()
    already_approved = await request_access(
        email=new_email,
        first_name="New",
        last_name="User",
        background_tasks=background_tasks,
        db=session,
        email_svc=mock_email_svc,
        settings=settings,
    )
    assert already_approved is False

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_notification
    assert isinstance(task.args[0], Settings)
    assert task.args[1] == settings.admin.email
    assert task.args[2].email == new_email  # type: ignore


async def test_request_access_approved(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    approved_email = "approved@example.com"
    req = AccessRequest(
        email=approved_email,
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(req)
    await session.commit()

    background_tasks = BackgroundTasks()
    already_approved = await request_access(
        email=approved_email,
        first_name="Test",
        last_name="User",
        background_tasks=background_tasks,
        db=session,
        email_svc=mock_email_svc,
        settings=settings,
    )

    assert already_approved is True

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_approved_email
    assert isinstance(task.args[0], Settings)
    assert task.args[1].email == approved_email  # type: ignore


async def test_request_access_existing_user(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    user = User(
        email="existing@example.com",
        username="existinguser",
        first_name="Existing",
        last_name="User",
        password_hash="fakehash",
    )
    session.add(user)
    await session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(EmailAlreadyRegistered):
        await request_access(
            email="existing@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db=session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0


async def test_request_access_pending(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    req = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    session.add(req)
    await session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(AccessRequestPending):
        await request_access(
            email="pending@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db=session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0


async def test_request_access_rejected(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    req = AccessRequest(
        email="rejected@example.com",
        first_name="Rejected",
        last_name="User",
        status=AccessRequestStatus.REJECTED,
    )
    session.add(req)
    await session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(AccessRequestRejected):
        await request_access(
            email="rejected@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db=session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0
