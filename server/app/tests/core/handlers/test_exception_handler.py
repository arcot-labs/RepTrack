import json

from fastapi import FastAPI
from fastapi import HTTPException as FastAPIHTTPException
from starlette.requests import Request
from starlette.types import Scope

from app.core.handlers import exception_handler


def create_request(is_prod: bool | None = None) -> Request:
    app = FastAPI()
    if is_prod is not None:
        app.state.is_prod = is_prod

    scope: Scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [],
        "app": app,
    }
    return Request(scope)


async def test_exception_handler_starlette_dict_detail(anyio_backend: str):
    _ = anyio_backend
    request = create_request()
    detail = {"detail": "some detail", "code": "custom_error"}
    exc = FastAPIHTTPException(status_code=401, detail=detail)

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 401
    assert payload == detail


async def test_exception_handler_starlette_non_dict_detail_non_prod(anyio_backend: str):
    _ = anyio_backend
    request = create_request(is_prod=False)
    exc = FastAPIHTTPException(status_code=404, detail="not found")

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 404
    assert payload == {"detail": "not found", "code": "http_error"}


async def test_exception_handler_starlette_non_dict_detail_prod(anyio_backend: str):
    _ = anyio_backend
    request = create_request(is_prod=True)
    exc = FastAPIHTTPException(status_code=403, detail="forbidden")

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 403
    assert payload == {"detail": "HTTP Error", "code": "http_error"}


async def test_exception_handler_unhandled_non_prod(anyio_backend: str):
    _ = anyio_backend
    request = create_request(is_prod=False)
    exc = ValueError("unexpected error")

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 500
    assert payload == {
        "detail": "unexpected error",
        "code": "internal_server_error",
    }


async def test_exception_handler_unhandled_prod(anyio_backend: str):
    _ = anyio_backend
    request = create_request(is_prod=True)
    exc = ValueError("sensitive error")

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 500
    assert payload == {
        "detail": "Internal Server Error",
        "code": "internal_server_error",
    }


async def test_exception_handler_default_prod(anyio_backend: str):
    _ = anyio_backend
    request = create_request()
    exc = ValueError("sensitive error")

    response = await exception_handler(request, exc)
    payload = json.loads(bytes(response.body))

    assert response.status_code == 500
    assert payload == {
        "detail": "Internal Server Error",
        "code": "internal_server_error",
    }
