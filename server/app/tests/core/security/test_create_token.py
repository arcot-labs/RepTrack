from app.core.security import (
    PASSWORD_HASH,
    TOKEN_PREFIX_LENGTH,
    _create_token,  # pyright: ignore[reportPrivateUsage]
    create_password_reset_token,
    create_registration_token,
)
from app.models.database.password_reset_token import PasswordResetToken
from app.models.database.registration_token import RegistrationToken

# _create_token tests use RegistrationToken
# PasswordResetToken behavior is identical
# wrappers are tested separately

# TODO validate


def test_create_token_registration_returns_token_and_model():
    token_str, token = _create_token(RegistrationToken, access_request_id=123)

    assert isinstance(token_str, str)
    assert len(token_str) > 0

    assert isinstance(token, RegistrationToken)
    assert token.token_prefix == token_str[:TOKEN_PREFIX_LENGTH]
    assert PASSWORD_HASH.verify(token_str, token.token_hash)
    assert token.access_request_id == 123


def test_create_token_registration_generates_unique_tokens():
    token_str_1, token_1 = _create_token(RegistrationToken, access_request_id=1)
    token_str_2, token_2 = _create_token(RegistrationToken, access_request_id=1)

    assert token_str_1 != token_str_2
    assert token_1.token_hash != token_2.token_hash
    assert token_1.token_prefix != token_2.token_prefix


def test_create_registration_token_returns_registration_token():
    token_str, token = create_registration_token(access_request_id=999)

    assert isinstance(token_str, str)
    assert len(token_str) > 0

    assert isinstance(token, RegistrationToken)
    assert token.token_prefix == token_str[:TOKEN_PREFIX_LENGTH]
    assert PASSWORD_HASH.verify(token_str, token.token_hash)
    assert token.access_request_id == 999


def test_create_password_reset_token_returns_password_reset_token():
    token_str, token = create_password_reset_token(user_id=777)

    assert isinstance(token_str, str)
    assert len(token_str) > 0

    assert isinstance(token, PasswordResetToken)
    assert token.token_prefix == token_str[:TOKEN_PREFIX_LENGTH]
    assert PASSWORD_HASH.verify(token_str, token.token_hash)
    assert token.user_id == 777
