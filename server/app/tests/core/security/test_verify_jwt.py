from datetime import datetime, timedelta, timezone

import jwt
import pytest

import app.core.security as security
from app.core.config import Settings
from app.core.security import verify_jwt
from app.models.errors import InvalidCredentials


def make_token(payload: dict[str, object], secret: str, algorithm: str) -> str:
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return str(token)


def test_verify_jwt_returns_username(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    username = settings.admin.username
    token = make_token(
        {
            "sub": username,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    result = verify_jwt(token, settings)
    assert result == username


def test_verify_jwt_raises_on_decode_error(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    token = make_token(
        {
            "sub": settings.admin.username,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        secret="wrong-jwt-secret-key",
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_raises_for_missing_sub(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    token = make_token(
        {"exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_raises_for_invalid_sub_shape(
    anyio_backend: str, settings: Settings
):
    _ = anyio_backend
    token = make_token(
        {
            "sub": [settings.admin.username],
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        secret=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    with pytest.raises(InvalidCredentials):
        verify_jwt(token, settings)


def test_verify_jwt_raises_on_jwtdata_validation_error(
    anyio_backend: str, settings: Settings, monkeypatch: pytest.MonkeyPatch
):
    _ = anyio_backend
    token = make_token(
        {
            "sub": settings.admin.username,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
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
