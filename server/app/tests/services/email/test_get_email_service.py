from collections.abc import Callable
from typing import Any

from app.core.config import (
    EmailConsoleSettings,
    EmailDisabledSettings,
    EmailLocalSettings,
    EmailSmtpSettings,
    Settings,
)
from app.services.email import (
    ConsoleEmailService,
    DisabledEmailService,
    SmtpEmailService,
    get_email_service,
)


def test_get_email_service_returns_smtp_service_for_smtp_backend(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = override_settings(
        {
            "email": EmailSmtpSettings(
                backend="smtp",
                email_from="test@example.com",
                smtp_host="smtp.example.com",
                smtp_port=1025,
                smtp_username="user",
                smtp_password="pass",
            )
        }
    )
    service = get_email_service(settings)

    assert isinstance(service, SmtpEmailService)


def test_get_email_service_returns_smtp_service_for_local_backend(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = override_settings(
        {
            "email": EmailLocalSettings(
                backend="local",
                email_from="test@example.com",
                smtp_host="localhost",
                smtp_port=1025,
            )
        }
    )
    service = get_email_service(settings)

    assert isinstance(service, SmtpEmailService)


def test_get_email_service_returns_console_service(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = override_settings(
        {
            "email": EmailConsoleSettings(backend="console"),
        }
    )
    service = get_email_service(settings)

    assert isinstance(service, ConsoleEmailService)


def test_get_email_service_returns_disabled_service(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = override_settings(
        {
            "email": EmailDisabledSettings(backend="disabled"),
        }
    )
    service = get_email_service(settings)

    assert isinstance(service, DisabledEmailService)
