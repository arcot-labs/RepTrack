import logging
from enum import Enum
from typing import Any

from httpx import AsyncClient

from app.core.config import Settings

logger = logging.getLogger(__name__)


class HttpMethod(str, Enum):
    GET = "get"
    POST = "post"
    DELETE = "delete"
    PUT = "put"
    PATCH = "patch"


async def make_http_request(
    client: AsyncClient,
    *,
    method: HttpMethod,
    endpoint: str,
    headers: dict[str, str] | None = None,
    json: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
):
    request = client.build_request(
        method=method.value,
        url=endpoint,
        headers=headers,
        json=json,
        data=data,
    )
    logger.debug(
        f"Making HTTP request: {method.value.upper()} {endpoint} with headers={headers}, json={json}, data={data}"
    )
    return await client.send(request)


async def login_admin(client: AsyncClient, settings: Settings):
    return await login(
        client,
        username=settings.admin.username,
        password=settings.admin.password,
    )


async def login(
    client: AsyncClient,
    *,
    username: str,
    password: str,
):
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/auth/login",
        json={
            "username": username,
            "password": password,
        },
    )
