from collections.abc import Callable
from unittest.mock import patch

from _pytest.logging import LogCaptureFixture

from app.core.config import (
    EmailConsoleSettings,
    EmailDisabledSettings,
    EmailSettings,
    EmailSmtpSettings,
    Settings,
)
from app.services.email import EmailService


async def test_smtp(
    anyio_backend: str,
    settings: Settings,
    override_email_settings: Callable[[EmailSettings], EmailService],
):
    _ = anyio_backend
    smtp_settings = EmailSmtpSettings(
        backend="smtp",
        email_from="test@example.com",
        smtp_host="smtp.example.com",
        smtp_port=1025,
        smtp_username="user",
        smtp_password="pass",
    )
    service = override_email_settings(smtp_settings)
    with patch("aiosmtplib.send") as mock_send:
        await service.send(settings, "user@example.com", "Test SMTP", "Body")
        mock_send.assert_called_once()


async def test_console(
    anyio_backend: str,
    settings: Settings,
    override_email_settings: Callable[[EmailSettings], EmailService],
    caplog: LogCaptureFixture,
):
    _ = anyio_backend
    console_settings = EmailConsoleSettings(backend="console")
    service = override_email_settings(console_settings)
    caplog.set_level("INFO")
    await service.send(settings, "user@example.com", "Subject", "Body")
    assert any("EMAIL (console)" in r.message for r in caplog.records)


async def test_disabled(
    anyio_backend: str,
    settings: Settings,
    override_email_settings: Callable[[EmailSettings], EmailService],
    caplog: LogCaptureFixture,
):
    _ = anyio_backend
    disabled_settings = EmailDisabledSettings(backend="disabled")
    service = override_email_settings(disabled_settings)
    caplog.set_level("DEBUG")
    await service.send(settings, "user@example.com", "Subject", "Body")
    assert any("skipping" in r.message for r in caplog.records)
