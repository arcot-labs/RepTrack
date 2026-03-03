from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import Settings
from app.core.security import (  # pyright: ignore[reportPrivateUsage]
    _create_jwt,
    create_access_jwt,
    create_refresh_jwt,
)

# _create_jwt tests cover core logic
# wrappers are tested separately


def test_create_jwt_returns_string_with_expected_payload(
    anyio_backend: str, settings: Settings
):
    _ = anyio_backend
    username = settings.admin.username
    expires_delta = timedelta(minutes=7)

    token = _create_jwt(
        username=username,
        expires_delta=expires_delta,
        secret_key=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    assert isinstance(token, str)
    assert len(token) > 0

    payload = jwt.decode(
        token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    assert payload["sub"] == username
    assert "exp" in payload


def test_create_jwt_respects_expiry_delta(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    expires_delta = timedelta(minutes=5)
    before_create = datetime.now(timezone.utc)

    token = _create_jwt(
        username="delta_user",
        expires_delta=expires_delta,
        secret_key=settings.jwt.secret_key,
        algorithm=settings.jwt.algorithm,
    )

    payload = jwt.decode(
        token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    expires_at = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    after_create = datetime.now(timezone.utc)

    earliest_expected = before_create + expires_delta - timedelta(seconds=2)
    latest_expected = after_create + expires_delta + timedelta(seconds=2)
    assert earliest_expected <= expires_at <= latest_expected


def test_create_access_jwt_returns_access_token(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    username = settings.admin.username
    token = create_access_jwt(username, settings)

    assert isinstance(token, str)
    assert len(token) > 0

    payload = jwt.decode(
        token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    assert payload["sub"] == username
    assert "exp" in payload


def test_create_refresh_jwt_returns_refresh_token(
    anyio_backend: str, settings: Settings
):
    _ = anyio_backend
    username = settings.admin.username
    token = create_refresh_jwt(username, settings)

    assert isinstance(token, str)
    assert len(token) > 0

    payload = jwt.decode(
        token,
        settings.jwt.secret_key,
        algorithms=[settings.jwt.algorithm],
    )
    assert payload["sub"] == username
    assert "exp" in payload
