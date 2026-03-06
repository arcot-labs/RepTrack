import pytest
from pydantic import ValidationError

from app.models.schemas.auth import LoginRequest, RegisterRequest


def test_login_request_accepts_username():
    req = LoginRequest(username="some_user", password="some_password")

    assert req.identifier == "some_user"


def test_login_request_accepts_email():
    req = LoginRequest(email="some_user@example.com", password="some_password")

    assert req.identifier == "some_user@example.com"


def test_login_request_requires_username_or_email():
    with pytest.raises(
        ValidationError,
        match="At least one of username or email must be provided",
    ):
        LoginRequest(password="some_password")


def test_register_request_rejects_email_like_username():
    with pytest.raises(ValidationError, match="Username cannot be an email address"):
        RegisterRequest(
            token="some_token",
            username="user@example.com",
            password="some_password",
        )
