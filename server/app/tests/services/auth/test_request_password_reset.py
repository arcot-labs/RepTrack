from unittest.mock import AsyncMock

from fastapi import BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.security import PASSWORD_HASH
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.user import User
from app.services.auth import request_password_reset


async def test_request_password_reset(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    user = User(
        email="reset@example.com",
        username="reset_user",
        first_name="Reset",
        last_name="User",
        password_hash=PASSWORD_HASH.hash("password"),
    )
    session.add(user)
    await session.commit()

    background_tasks = BackgroundTasks()

    await request_password_reset(
        email=user.email,
        background_tasks=background_tasks,
        db=session,
        email_svc=mock_email_svc,
        settings=settings,
    )

    tokens = (
        (
            await session.execute(
                select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
            )
        )
        .scalars()
        .all()
    )
    assert len(tokens) == 1

    assert len(background_tasks.tasks) == 1
    task = background_tasks.tasks[0]
    assert task.func == mock_email_svc.send_password_reset_email
    assert task.args[0] == settings
    assert task.args[1] == user.email
    assert isinstance(task.args[2], str)


async def test_request_password_reset_unregistered_email(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    background_tasks = BackgroundTasks()

    await request_password_reset(
        email="missing@example.com",
        background_tasks=background_tasks,
        db=session,
        email_svc=mock_email_svc,
        settings=settings,
    )

    tokens = (await session.execute(select(PasswordResetToken))).scalars().all()
    assert len(tokens) == 0
    assert len(background_tasks.tasks) == 0


async def test_request_password_reset_admin_email(
    session: AsyncSession, mock_email_svc: AsyncMock, settings: Settings
):
    background_tasks = BackgroundTasks()

    await request_password_reset(
        email=settings.admin.email,
        background_tasks=background_tasks,
        db=session,
        email_svc=mock_email_svc,
        settings=settings,
    )

    tokens = (await session.execute(select(PasswordResetToken))).scalars().all()
    assert len(tokens) == 0
    assert len(background_tasks.tasks) == 0
