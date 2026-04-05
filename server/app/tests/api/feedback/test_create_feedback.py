from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings

from ..utilities import HttpMethod, login_admin, make_http_request

_MOCK_DATA = {
    "type": "feedback",
    "url": "https://example.com/page",
    "build": "v1",
    "title": "Bug report",
    "description": "The page crashes when clicking submit.",
}
_MOCK_FILE = ("file.txt", b"mock file content", "text/plain")


async def _make_request(
    client: AsyncClient,
    data: dict[str, Any] = _MOCK_DATA,
    files: list[tuple[str, bytes, str]] | None = None,
):
    if files is None:
        files = [_MOCK_FILE]
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/feedback",
        data=data,
        files=files,
    )


# 202
async def test_create_feedback(
    client: AsyncClient, settings: Settings, monkeypatch: pytest.MonkeyPatch
):
    store_files_mock = AsyncMock(return_value=[])
    monkeypatch.setattr("app.services.feedback.store_files", store_files_mock)

    await login_admin(client, settings)
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_202_ACCEPTED
    store_files_mock.assert_awaited_once()


# 401
async def test_create_feedback_not_logged_in(client: AsyncClient):
    resp = await client.post("/api/feedback")

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 422
async def test_create_feedback_invalid_body(client: AsyncClient, settings: Settings):
    await login_admin(client, settings)
    resp = await _make_request(client, data={"invalid": "data"})

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "type"]
    assert body["detail"][1]["loc"] == ["body", "url"]
    assert body["detail"][2]["loc"] == ["body", "build"]
    assert body["detail"][3]["loc"] == ["body", "title"]
    assert body["detail"][4]["loc"] == ["body", "description"]
