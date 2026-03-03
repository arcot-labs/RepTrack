from fastapi import status
from httpx import AsyncClient

from app.core.config import Settings
from app.tests.api.utilities import HttpMethod, make_http_request


async def make_request(client: AsyncClient, email: str):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/auth/forgot-password",
        json={
            "email": email,
        },
    )


# 204
async def test_forgot_password(client: AsyncClient, settings: Settings):
    resp = await make_request(client, email=settings.admin.email)
    assert resp.status_code == status.HTTP_204_NO_CONTENT


# 422
async def test_forgot_password_invalid_email(client: AsyncClient):
    resp = await make_request(client, email="not-an-email")

    assert resp.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = resp.json()
    assert body["detail"][0]["loc"] == ["body", "email"]
