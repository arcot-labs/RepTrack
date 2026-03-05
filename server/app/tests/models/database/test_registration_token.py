from datetime import UTC, datetime, timedelta

from app.models.database.registration_token import RegistrationToken


def test_registration_token_is_used_returns_false_when_used_at_missing():
    token = RegistrationToken(used_at=None)

    assert token.is_used() is False


def test_registration_token_is_used_returns_true_when_used_at_set():
    token = RegistrationToken(used_at=datetime.now(UTC))

    assert token.is_used() is True


def test_registration_token_is_expired_returns_true_for_past_expiry():
    token = RegistrationToken(expires_at=datetime.now(UTC) - timedelta(seconds=1))

    assert token.is_expired() is True


def test_registration_token_is_expired_returns_false_for_future_expiry():
    token = RegistrationToken(expires_at=datetime.now(UTC) + timedelta(seconds=1))

    assert token.is_expired() is False
