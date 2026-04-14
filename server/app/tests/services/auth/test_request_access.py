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
    EmailInUse,
)
from app.services.auth import request_access


async def test_request_access(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    new_email = "newuser@example.com"
    background_tasks = BackgroundTasks()
    already_approved = await request_access(
        email=new_email,
        first_name="New",
        last_name="User",
        background_tasks=background_tasks,
        db_session=db_session,
        email_svc=mock_email_svc,
        settings=settings,
    )
    assert already_approved is False

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_notification_email
    assert isinstance(task.args[0], Settings)
    assert task.args[1] == settings.admin.email
    assert isinstance(task.args[2], AccessRequest)
    assert task.args[2].email == new_email


async def test_request_access_approved(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    approved_email = "approved@example.com"
    req = AccessRequest(
        email=approved_email,
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(req)
    await db_session.commit()

    background_tasks = BackgroundTasks()
    already_approved = await request_access(
        email=approved_email,
        first_name="Test",
        last_name="User",
        background_tasks=background_tasks,
        db_session=db_session,
        email_svc=mock_email_svc,
        settings=settings,
    )

    assert already_approved is True

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_access_request_approved_email
    assert isinstance(task.args[0], Settings)
    assert isinstance(task.args[1], AccessRequest)
    assert task.args[1].email == approved_email


async def test_request_access_existing_user(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    user = User(
        email="existing@example.com",
        username="existinguser",
        first_name="Existing",
        last_name="User",
        password_hash="fakehash",
    )
    db_session.add(user)
    await db_session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(EmailInUse):
        await request_access(
            email="existing@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db_session=db_session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0


async def test_request_access_email_matches_username(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    collision_identifier = "existing@example.com"
    db_session.add(
        User(
            email="different@example.com",
            username=collision_identifier,
            first_name="Existing",
            last_name="User",
            password_hash="fakehash",
        )
    )
    await db_session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(EmailInUse):
        await request_access(
            email=collision_identifier,
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db_session=db_session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0


async def test_request_access_pending(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    req = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(req)
    await db_session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(AccessRequestPending):
        await request_access(
            email="pending@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db_session=db_session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0


async def test_request_access_rejected(
    db_session: AsyncSession,
    mock_email_svc: AsyncMock,
    settings: Settings,
):
    req = AccessRequest(
        email="rejected@example.com",
        first_name="Rejected",
        last_name="User",
        status=AccessRequestStatus.REJECTED,
    )
    db_session.add(req)
    await db_session.commit()

    background_tasks = BackgroundTasks()
    with pytest.raises(AccessRequestRejected):
        await request_access(
            email="rejected@example.com",
            first_name="Test",
            last_name="User",
            background_tasks=background_tasks,
            db_session=db_session,
            email_svc=mock_email_svc,
            settings=settings,
        )

    assert len(background_tasks.tasks) == 0
