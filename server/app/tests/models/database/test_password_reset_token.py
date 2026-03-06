from datetime import UTC, datetime, timedelta

from app.models.database.password_reset_token import PasswordResetToken


def test_password_reset_token_used():
    unused_token = PasswordResetToken(used_at=None)
    used_token = PasswordResetToken(used_at=datetime.now(UTC))

    assert unused_token.is_used() is False
    assert used_token.is_used() is True


def test_password_reset_token_expired():
    expired_token = PasswordResetToken(
        expires_at=datetime.now(UTC) - timedelta(seconds=1)
    )
    active_token = PasswordResetToken(
        expires_at=datetime.now(UTC) + timedelta(seconds=1)
    )

    assert expired_token.is_expired() is True
    assert active_token.is_expired() is False
