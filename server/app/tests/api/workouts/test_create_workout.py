from datetime import datetime

from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings

from ..utilities import HttpMethod, login_admin, make_http_request


async def _make_request(
    client: AsyncClient,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    notes: str | None = None,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/workouts",
        json={
            "started_at": started_at.isoformat() if started_at else None,
            "ended_at": ended_at.isoformat() if ended_at else None,
            "notes": notes,
        },
    )


# 204
async def test_create_workout(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await _make_request(
        client,
        started_at=datetime.now(),
        ended_at=datetime.now(),
        notes="Leg day",
    )

    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 401
async def test_create_workout_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
