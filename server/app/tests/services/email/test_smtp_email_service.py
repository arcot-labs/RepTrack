from collections.abc import Callable
from typing import Any
from unittest.mock import ANY, AsyncMock, patch

from app.core.config import EmailLocalSettings, EmailSmtpSettings, Settings
from app.services.email import SmtpEmailService


async def test_smtp_email_service_smtp_backend_send(
    anyio_backend: str,
    override_settings: Callable[[dict[str, Any]], Settings],
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
    settings = override_settings(
        {
            "email": smtp_settings,
        }
    )
    service = SmtpEmailService()

    with patch("app.services.email.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await service.send(
            settings,
            "user@example.com",
            "Test SMTP",
            "Body",
            html="<b>Body</b>",
        )

    mock_send.assert_awaited_once_with(
        ANY,
        hostname=smtp_settings.smtp_host,
        port=smtp_settings.smtp_port,
        timeout=10,
        start_tls=True,
        tls_context=ANY,
        username=smtp_settings.smtp_username,
        password=smtp_settings.smtp_password,
    )


async def test_smtp_email_service_local_backend_send(
    anyio_backend: str,
    override_settings: Callable[[dict[str, Any]], Settings],
):
    _ = anyio_backend
    local_settings = EmailLocalSettings(
        backend="local",
        email_from="test@example.com",
        smtp_host="localhost",
        smtp_port=1025,
    )
    settings = override_settings(
        {
            "email": local_settings,
        }
    )
    service = SmtpEmailService()

    with patch("app.services.email.aiosmtplib.send", new=AsyncMock()) as mock_send:
        await service.send(
            settings,
            "user@example.com",
            "Local SMTP",
            "Body",
        )

    mock_send.assert_awaited_once_with(
        ANY,
        hostname=local_settings.smtp_host,
        port=local_settings.smtp_port,
        timeout=10,
        start_tls=False,
        tls_context=None,
    )
