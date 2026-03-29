from fastapi import status
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.user import User
from app.models.errors import InsufficientPermissions

from ..utilities import HttpMethod, login_admin, make_http_request
from .utilities import reindex_via_api


async def _make_request(
    client: AsyncClient,
    task_id: int,
):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint=f"/api/search/tasks/{task_id}",
    )


# 200
async def test_get_search_task(
    client: AsyncClient,
    settings: Settings,
):
    await login_admin(client, settings)

    resp = await reindex_via_api(client)
    assert resp.status_code == status.HTTP_204_NO_CONTENT

    resp = await _make_request(client, task_id=0)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body["uid"] == 0
    assert "status" in body


# 401
async def test_get_search_task_not_logged_in(client: AsyncClient):
    resp = await _make_request(client, task_id=0)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 403
async def test_get_search_task_not_admin(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await db_session.execute(
        update(User)
        .where(User.username == settings.admin.username)
        .values(is_admin=False)
    )
    await db_session.commit()

    await login_admin(client, settings)
    resp = await _make_request(client, task_id=0)

    assert resp.status_code == InsufficientPermissions.status_code
    body = resp.json()
    assert body["detail"] == InsufficientPermissions.detail
