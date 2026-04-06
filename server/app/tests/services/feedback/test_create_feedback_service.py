from unittest.mock import AsyncMock

import pytest
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.feedback import Feedback
from app.models.schemas.feedback import CreateFeedbackRequest, FeedbackType
from app.models.schemas.storage import StoredFile
from app.services.feedback import create_feedback

from ..utilities import get_admin_user_public


async def test_create_feedback(
    db_session: AsyncSession,
    mock_github_svc: AsyncMock,
    settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
):
    stored_files = [
        StoredFile(
            original_name="screen.png",
            size=123,
            path="2026-03/file.png",
        )
    ]
    store_files_mock = AsyncMock(return_value=stored_files)
    monkeypatch.setattr("app.services.feedback.store_files", store_files_mock)

    user = await get_admin_user_public(db_session, settings)
    upload_file = UploadFile(filename="screen.png", file=AsyncMock())
    request = CreateFeedbackRequest(
        type=FeedbackType.feedback,
        url="https://example.com/page",
        build="v1",
        title="Feedback title",
        description="Feedback description",
        files=[upload_file],
    )

    await create_feedback(
        user=user,
        req=request,
        db_session=db_session,
        github_svc=mock_github_svc,
        settings=settings,
    )

    feedback = (
        await db_session.execute(
            select(Feedback).where(Feedback.title == request.title)
        )
    ).scalar_one()
    assert feedback.user_id == user.id
    assert feedback.type == request.type
    assert feedback.url == request.url
    assert feedback.title == request.title
    assert feedback.description == request.description
    assert feedback.files == stored_files

    store_files_mock.assert_awaited_once_with(
        request.files,
        settings.data_dir / "feedback",
    )
    mock_github_svc.create_feedback_issue.assert_awaited_once_with(
        feedback,
        settings,
    )


async def test_create_feedback_no_files(
    db_session: AsyncSession,
    mock_github_svc: AsyncMock,
    settings: Settings,
    monkeypatch: pytest.MonkeyPatch,
):
    store_files_mock = AsyncMock(return_value=[])
    monkeypatch.setattr("app.services.feedback.store_files", store_files_mock)

    user = await get_admin_user_public(db_session, settings)
    request = CreateFeedbackRequest(
        type=FeedbackType.feature,
        url="https://example.com/feature",
        build="v1",
        title="Feature title",
        description="Feature description",
    )

    await create_feedback(
        user=user,
        req=request,
        db_session=db_session,
        github_svc=mock_github_svc,
        settings=settings,
    )

    feedback = (
        await db_session.execute(
            select(Feedback).where(Feedback.title == request.title)
        )
    ).scalar_one()
    assert feedback.files == []

    store_files_mock.assert_not_awaited()
    mock_github_svc.create_feedback_issue.assert_awaited_once_with(
        feedback,
        settings,
    )
