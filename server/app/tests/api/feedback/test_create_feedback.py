from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.tests.api.utilities import HttpMethod, login_admin

MOCK_DATA = {
    "type": "feedback",
    "url": "https://example.com/page",
    "title": "Bug report",
    "description": "The page crashes when clicking submit.",
}
MOCK_FILE = ("file.txt", b"mock file content", "text/plain")


async def make_request(
    client: AsyncClient,
    data: dict[str, Any] = MOCK_DATA,
    files: list[tuple[str, bytes, str]] | None = None,
):
    if files is None:
        files = [MOCK_FILE]
    request = client.build_request(
        method=HttpMethod.POST.value,
        url="/api/feedback",
        data=data,
        files=[("files", file) for file in files],
    )
    return await client.send(request)


# 202
async def test_create_feedback(
    client: AsyncClient, settings: Settings, monkeypatch: pytest.MonkeyPatch
):
    store_files_mock = AsyncMock(return_value=[])
    monkeypatch.setattr("app.services.feedback.store_files", store_files_mock)

    await login_admin(client, settings)
    resp = await make_request(client)

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
    resp = await make_request(client, data={"invalid": "data"})

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "type"]
    assert body["detail"][1]["loc"] == ["body", "url"]
    assert body["detail"][2]["loc"] == ["body", "title"]
    assert body["detail"][3]["loc"] == ["body", "description"]
