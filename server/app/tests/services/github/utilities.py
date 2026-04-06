from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any, Self

import httpx
import pytest

from app.core.config import GitHubApiSettings, Settings
from app.models.database.feedback import Feedback
from app.models.enums import FeedbackType
from app.models.schemas.storage import StoredFile


class SuccessResponse:
    def raise_for_status(self) -> None:
        return None


class FailureResponse:
    text = "bad request"

    def raise_for_status(self) -> None:
        request = httpx.Request(
            "POST", "https://api.github.com/repos/owner/RepTrack/issues"
        )
        response = httpx.Response(400, request=request, text=self.text)
        raise httpx.HTTPStatusError("error", request=request, response=response)


def api_settings(
    override_settings: Callable[[dict[str, Any]], Settings],
) -> Settings:
    return override_settings(
        {
            "gh": GitHubApiSettings(
                backend="api",
                repo_owner="owner",
                token="token",
                issue_assignee="assignee",
            )
        }
    )


def feedback(feedback_type: FeedbackType, with_files: bool) -> Feedback:
    files: list[StoredFile] = []
    if with_files:
        files = [
            StoredFile(
                original_name="file.txt",
                size=123,
                path="2026-03/file.txt",
            )
        ]
    return Feedback(
        id=77,
        user_id=5,
        type=feedback_type,
        url="https://example.com/page",
        build="v1",
        title="Title",
        description="Description",
        files=files,
        created_at=datetime(2026, 3, 3, 12, 34, 56, tzinfo=UTC),
    )


def patch_async_client(
    monkeypatch: pytest.MonkeyPatch,
    post_impl: Callable[[str, dict[str, str], dict[str, Any]], Any],
) -> None:
    class Client:
        async def __aenter__(self) -> Self:
            return self

        async def __aexit__(
            self,
            exc_type: type[BaseException] | None,
            exc: BaseException | None,
            tb: Any,
        ) -> None:
            _ = (exc_type, exc, tb)
            return None

        async def post(
            self,
            url: str,
            headers: dict[str, str],
            json: dict[str, Any],
        ):
            return post_impl(url, headers, json)

    monkeypatch.setattr("app.services.github.httpx.AsyncClient", Client)
