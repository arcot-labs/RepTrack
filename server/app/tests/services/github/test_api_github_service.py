from collections.abc import Callable
from typing import Any

import pytest
from _pytest.logging import LogCaptureFixture

from app.core.config import Settings
from app.models.enums import FeedbackType
from app.services.github import ApiGitHubService

from .utilities import (
    FailureResponse,
    SuccessResponse,
    api_settings,
    feedback,
    patch_async_client,
)


async def test_api_github_service_create_feedback(
    anyio_backend: str,
    monkeypatch: pytest.MonkeyPatch,
    override_settings: Callable[[dict[str, Any]], Settings],
):
    _ = anyio_backend
    captured: dict[str, object] = {}

    def post(
        url: str, headers: dict[str, str], json: dict[str, Any]
    ) -> SuccessResponse:
        captured["url"] = url
        captured["headers"] = headers
        captured["json"] = json
        return SuccessResponse()

    patch_async_client(monkeypatch, post)

    service = ApiGitHubService()
    settings = api_settings(override_settings)
    feedback_obj = feedback(FeedbackType.feedback, with_files=True)

    await service.create_feedback_issue(feedback_obj, settings)

    assert captured["url"] == "https://api.github.com/repos/owner/RepTrack/issues"
    headers = captured["headers"]
    assert isinstance(headers, dict)
    assert headers["Authorization"] == "Bearer token"

    payload = captured["json"]
    assert isinstance(payload, dict)
    assert payload["title"] == "[Feedback] Title"
    assert payload["assignees"] == ["assignee"]
    assert "### Attachments" in payload["body"]
    assert "file.txt" in payload["body"]
    assert "(`2026-03/file.txt`)" in payload["body"]


async def test_api_github_service_create_feature_request(
    anyio_backend: str,
    monkeypatch: pytest.MonkeyPatch,
    override_settings: Callable[[dict[str, Any]], Settings],
):
    _ = anyio_backend
    captured: dict[str, object] = {}

    def post(
        url: str, headers: dict[str, str], json: dict[str, Any]
    ) -> SuccessResponse:
        _ = (url, headers)
        captured["json"] = json
        return SuccessResponse()

    patch_async_client(monkeypatch, post)

    service = ApiGitHubService()
    settings = api_settings(override_settings)
    feedback_obj = feedback(FeedbackType.feature, with_files=False)

    await service.create_feedback_issue(feedback_obj, settings)

    payload = captured["json"]
    assert isinstance(payload, dict)
    assert payload["title"] == "[Feature Request] Title"
    assert "### Attachments" not in payload["body"]


async def test_api_github_service_http_error(
    anyio_backend: str,
    monkeypatch: pytest.MonkeyPatch,
    override_settings: Callable[[dict[str, Any]], Settings],
    caplog: LogCaptureFixture,
):
    _ = anyio_backend

    def post(
        url: str, headers: dict[str, str], json: dict[str, Any]
    ) -> FailureResponse:
        _ = (url, headers, json)
        return FailureResponse()

    patch_async_client(monkeypatch, post)

    service = ApiGitHubService()
    settings = api_settings(override_settings)
    feedback_obj = feedback(FeedbackType.feedback, with_files=True)

    await service.create_feedback_issue(feedback_obj, settings)

    assert any(
        "Failed to create GitHub issue for feedback id: 77" in record.message
        for record in caplog.records
    )


async def test_api_github_service_unexpected_error(
    anyio_backend: str,
    monkeypatch: pytest.MonkeyPatch,
    override_settings: Callable[[dict[str, Any]], Settings],
    caplog: LogCaptureFixture,
):
    _ = anyio_backend

    def post(
        url: str, headers: dict[str, str], json: dict[str, Any]
    ) -> SuccessResponse:
        _ = (url, headers, json)
        raise RuntimeError("unexpected")

    patch_async_client(monkeypatch, post)

    service = ApiGitHubService()
    settings = api_settings(override_settings)
    feedback_obj = feedback(FeedbackType.feature, with_files=False)

    await service.create_feedback_issue(feedback_obj, settings)

    assert any(
        "Unexpected error while creating GitHub issue for feedback id: 77"
        in record.message
        for record in caplog.records
    )
