from fastapi import status
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.feedback import FeedbackType
from app.models.database.user import User
from app.models.errors import (
    AccessRequestNotFound,
    AccessRequestNotPending,
    InsufficientPermissions,
)

from ..utilities import (
    HttpMethod,
    get_admin,
    login_admin,
    make_http_request,
)


async def _make_request(
    client: AsyncClient, access_request_id: int, status_value: AccessRequestStatus
):
    return await make_http_request(
        client,
        method=HttpMethod.PATCH,
        endpoint=f"/api/admin/access-requests/{access_request_id}",
        json={
            "status": status_value.value,
        },
    )


# 204
async def test_update_access_request_status(
    client: AsyncClient, db_session: AsyncSession, settings: Settings
):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    db_session.add(access_request)
    await db_session.commit()

    admin = await get_admin(db_session, settings)

    await login_admin(client, settings)
    resp = await _make_request(client, access_request.id, AccessRequestStatus.APPROVED)

    assert resp.status_code == status.HTTP_204_NO_CONTENT

    await db_session.refresh(access_request)
    assert access_request.status == AccessRequestStatus.APPROVED
    assert access_request.reviewed_at is not None
    assert access_request.reviewed_by == admin.id


# 400
async def test_update_access_request_status_not_pending(
    client: AsyncClient, db_session: AsyncSession, settings: Settings
):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    db_session.add(access_request)
    await db_session.commit()

    await login_admin(client, settings)
    resp = await _make_request(client, access_request.id, AccessRequestStatus.REJECTED)

    assert resp.status_code == AccessRequestNotPending.status_code
    body = resp.json()
    assert body["detail"] == AccessRequestNotPending.detail


# 401
async def test_update_access_request_status_not_logged_in(client: AsyncClient):
    resp = await _make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 403
async def test_update_access_request_status_non_admin_user(
    client: AsyncClient, db_session: AsyncSession, settings: Settings
):
    await db_session.execute(
        update(User)
        .where(User.username == settings.admin.username)
        .values(is_admin=False)
    )
    await db_session.commit()

    await login_admin(client, settings)
    resp = await _make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == InsufficientPermissions.status_code
    body = resp.json()
    assert body["detail"] == InsufficientPermissions.detail


# 404
async def test_update_access_request_status_not_found(
    client: AsyncClient, settings: Settings
):
    await login_admin(client, settings)
    resp = await _make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == AccessRequestNotFound.status_code
    body = resp.json()
    assert body["detail"] == AccessRequestNotFound.detail


# 422
async def test_update_access_request_status_invalid_status(
    client: AsyncClient, settings: Settings
):
    await login_admin(client, settings)
    resp = await _make_request(client, 1, FeedbackType.feedback)  # type: ignore

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "status"]
