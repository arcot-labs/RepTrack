from datetime import UTC, datetime, timedelta

from app.models.database.password_reset_token import PasswordResetToken


def test_password_reset_token_is_used_returns_false_when_used_at_missing():
    token = PasswordResetToken(used_at=None)

    assert token.is_used() is False


def test_password_reset_token_is_used_returns_true_when_used_at_set():
    token = PasswordResetToken(used_at=datetime.now(UTC))

    assert token.is_used() is True


def test_password_reset_token_is_expired_returns_true_for_past_expiry():
    token = PasswordResetToken(expires_at=datetime.now(UTC) - timedelta(seconds=1))

    assert token.is_expired() is True


def test_password_reset_token_is_expired_returns_false_for_future_expiry():
    token = PasswordResetToken(expires_at=datetime.now(UTC) + timedelta(seconds=1))

    assert token.is_expired() is False
