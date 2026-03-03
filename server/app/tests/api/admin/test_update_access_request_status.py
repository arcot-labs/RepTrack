from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.access_request import AccessRequest, AccessRequestStatus
from app.models.database.feedback import FeedbackType
from app.models.database.user import User
from app.models.errors import (
    AccessRequestStatusError,
    InsufficientPermissions,
    NotFound,
)
from app.tests.api.utilities import HttpMethod, login_admin, make_http_request


async def make_request(
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


async def get_admin(session: AsyncSession, settings: Settings) -> User:
    result = await session.execute(
        select(User).where(User.username == settings.admin.username)
    )
    return result.scalar_one()


# 204
async def test_update_access_request_status_approved(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    access_request = AccessRequest(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        status=AccessRequestStatus.PENDING,
    )
    session.add(access_request)
    await session.commit()

    admin = await get_admin(session, settings)

    await login_admin(client, settings)
    resp = await make_request(client, access_request.id, AccessRequestStatus.APPROVED)

    assert resp.status_code == status.HTTP_204_NO_CONTENT

    await session.refresh(access_request)
    assert access_request.status == AccessRequestStatus.APPROVED
    assert access_request.reviewed_at is not None
    assert access_request.reviewed_by == admin.id


# 400
async def test_update_access_request_status_not_pending(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    access_request = AccessRequest(
        email="approved@example.com",
        first_name="Approved",
        last_name="User",
        status=AccessRequestStatus.APPROVED,
    )
    session.add(access_request)
    await session.commit()

    await login_admin(client, settings)
    resp = await make_request(client, access_request.id, AccessRequestStatus.REJECTED)

    assert resp.status_code == AccessRequestStatusError.status_code
    body = resp.json()
    assert body["detail"] == AccessRequestStatusError.detail


# 401
async def test_update_access_request_status_not_logged_in(client: AsyncClient):
    resp = await make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"


# 403
async def test_update_access_request_status_non_admin_user(
    client: AsyncClient, session: AsyncSession, settings: Settings
):
    await session.execute(
        update(User)
        .where(User.username == settings.admin.username)
        .values(is_admin=False)
    )
    await session.commit()

    await login_admin(client, settings)
    resp = await make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == InsufficientPermissions.status_code
    body = resp.json()
    assert body["detail"] == InsufficientPermissions.detail


# 404
async def test_update_access_request_status_not_found(
    client: AsyncClient, settings: Settings
):
    await login_admin(client, settings)
    resp = await make_request(client, 1, AccessRequestStatus.APPROVED)

    assert resp.status_code == NotFound.status_code
    body = resp.json()
    assert body["detail"] == NotFound.detail


# 422
async def test_update_access_request_status_invalid_status(
    client: AsyncClient, settings: Settings
):
    await login_admin(client, settings)
    resp = await make_request(client, 1, FeedbackType.feedback)  # type: ignore

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "status"]
