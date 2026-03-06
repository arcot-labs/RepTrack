from app.models.schemas.config import (
    EmailConsoleSettings,
    EmailDisabledSettings,
    EmailLocalSettings,
)


def test_email_local_settings():
    settings = EmailLocalSettings(
        backend="local",
        email_from="noreply@example.com",
        smtp_host="localhost",
        smtp_port=1025,
    )

    assert settings.smtp_username is None
    assert settings.smtp_password is None


def test_email_console_settings():
    settings = EmailConsoleSettings(backend="console")

    assert settings.email_from is None
    assert settings.smtp_host is None
    assert settings.smtp_port is None
    assert settings.smtp_username is None
    assert settings.smtp_password is None


def test_email_disabled_settings():
    settings = EmailDisabledSettings(backend="disabled")

    assert settings.email_from is None
    assert settings.smtp_host is None
    assert settings.smtp_port is None
    assert settings.smtp_username is None
    assert settings.smtp_password is None
