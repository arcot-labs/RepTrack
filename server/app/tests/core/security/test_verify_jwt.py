from datetime import UTC, datetime, timedelta

import jwt
import pytest

import app.core.security as security
from app.core.config import Settings
from app.core.security import verify_jwt
from app.models.errors import InvalidCredentials


def _create_jwt(payload: dict[str, object], secret: str, algorithm: str) -> str:
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return str(token)


def test_verify_jwt(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    username = settings.admin.username
    token = _create_jwt(
        {
            "sub": username,
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    result = verify_jwt(token, settings)
    assert result == username


def test_verify_jwt_wrong_secret(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    token = _create_jwt(
        {
            "sub": settings.admin.username,
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        secret="wrong-jwt-secret-key-at-least-32-bytes",
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_missing_sub(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    token = _create_jwt(
        {"exp": datetime.now(UTC) + timedelta(minutes=5)},
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_invalid_sub(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    token = _create_jwt(
        {
            "sub": [settings.admin.username],
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_validation_error(
    anyio_backend: str, settings: Settings, monkeypatch: pytest.MonkeyPatch
):
    _ = anyio_backend
    token = _create_jwt(
        {
            "sub": settings.admin.username,
            "exp": datetime.now(UTC) + timedelta(minutes=5),
        },
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    def raise_validation_error(*args: object, **kwargs: object):
        _ = args, kwargs
        raise ValueError("forced JWTData validation failure")

    monkeypatch.setattr(security, "JWTData", raise_validation_error)

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)
