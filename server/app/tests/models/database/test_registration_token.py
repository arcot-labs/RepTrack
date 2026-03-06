from datetime import UTC, datetime, timedelta

from app.models.database.registration_token import RegistrationToken


def test_registration_token_used():
    unused_token = RegistrationToken(used_at=None)
    used_token = RegistrationToken(used_at=datetime.now(UTC))

    assert unused_token.is_used() is False
    assert used_token.is_used() is True


def test_registration_token_expired():
    expired_token = RegistrationToken(
        expires_at=datetime.now(UTC) - timedelta(seconds=1)
    )
    active_token = RegistrationToken(
        expires_at=datetime.now(UTC) + timedelta(seconds=1)
    )

    assert expired_token.is_expired() is True
    assert active_token.is_expired() is False
