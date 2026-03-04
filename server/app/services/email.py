import logging
import ssl
from abc import ABC, abstractmethod
from datetime import UTC, datetime
from email.message import EmailMessage
from typing import Annotated

import aiosmtplib
from fastapi import Depends

from app.core.config import Settings, get_settings
from app.models.database.access_request import AccessRequest
from app.utilities.date import get_utc_timestamp_str

logger = logging.getLogger(__name__)


def get_email_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmailService:
    match settings.email.backend:
        case "smtp" | "local":
            return SmtpEmailService()
        case "console":
            return ConsoleEmailService()
        case "disabled":
            return DisabledEmailService()


class EmailService(ABC):
    @abstractmethod
    async def send(
        self,
        settings: Settings,
        to: str,
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None: ...

    async def send_access_request_notification(
        self,
        settings: Settings,
        admin_email: str,
        access_request: AccessRequest,
    ) -> None:
        logger.info(
            f"Sending access request notification to {admin_email} for request id {access_request.id}"
        )

        subject = f"New Access Request - {settings.project_name}"
        body = (
            f"{access_request.first_name} {access_request.last_name} ({access_request.email}) "
            f"has requested access (request id {access_request.id})."
        )
        try:
            await self.send(
                settings=settings,
                to=admin_email,
                subject=subject,
                text=body,
            )
        except Exception as e:
            logger.error(
                f"Failed to send access request notification to {admin_email}: {e}"
            )

    async def send_access_request_approved_email(
        self,
        settings: Settings,
        access_request: AccessRequest,
        token: str,
    ) -> None:
        logger.info(f"Sending access request approved email to {access_request.email}")

        subject = f"Access Request Approved - {settings.project_name}"
        url = f"{settings.client_url}/register?token={token}"
        text = (
            "Your access request has been approved!\n"
            f"Please register to access the application: {url}\n"
            "This link will expire in 7 days."
        )
        html = (
            "Your access request has been approved!"
            f'<br>Please <a href="{url}">register</a> to access the application.'
            "<br>This link will expire in 7 days."
        )
        try:
            await self.send(
                settings=settings,
                to=access_request.email,
                subject=subject,
                text=text,
                html=html,
            )
        except Exception as e:
            logger.error(
                f"Failed to send access request approved email to {access_request.email}: {e}"
            )

    async def send_access_request_rejected_email(
        self,
        settings: Settings,
        access_request: AccessRequest,
    ) -> None:
        logger.info(f"Sending access request rejected email to {access_request.email}")

        subject = f"Access Request Rejected - {settings.project_name}"
        body = (
            "Your access request has been rejected.\n"
            "If you believe this is a mistake, please contact an admin."
        )
        try:
            await self.send(
                settings=settings,
                to=access_request.email,
                subject=subject,
                text=body,
            )
        except Exception as e:
            logger.error(
                f"Failed to send access request rejected email to {access_request.email}: {e}"
            )

    async def send_password_reset_email(
        self,
        settings: Settings,
        email: str,
        token: str,
    ) -> None:
        logger.info(f"Sending password reset email to {email}")

        subject = f"Password Reset - {settings.project_name}"
        url = f"{settings.client_url}/reset-password?token={token}"
        text = (
            "A request was made to reset your password.\n"
            f"Reset your password here: {url}\n"
            "This link will expire in 1 hour."
        )
        html = (
            "A request was made to reset your password."
            f'<br>Reset your password <a href="{url}">here</a>.'
            "<br>This link will expire in 1 hour."
        )
        try:
            await self.send(
                settings=settings,
                to=email,
                subject=subject,
                text=text,
                html=html,
            )
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")


class SmtpEmailService(EmailService):
    async def send(
        self,
        settings: Settings,
        to: str,
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        now = get_utc_timestamp_str(datetime.now(UTC))
        logger.info(f"Sending email to {to} with subject {subject} ({now})")

        message = EmailMessage()
        message["From"] = settings.email.email_from
        message["To"] = to
        message["Subject"] = subject

        if html:
            message.set_content(text)
            message.add_alternative(html, subtype="html")
        else:
            message.set_content(text)

        # local backend does not support TLS
        use_tls = settings.email.backend == "smtp"
        tls_context = ssl.create_default_context()
        tls_context.check_hostname = False
        tls_context.verify_mode = ssl.CERT_NONE

        kwargs = dict(
            hostname=settings.email.smtp_host,
            port=settings.email.smtp_port,
            timeout=10,
            start_tls=use_tls,
            tls_context=tls_context if use_tls else None,
        )

        if settings.email.smtp_username and settings.email.smtp_password:
            kwargs["username"] = settings.email.smtp_username
            kwargs["password"] = settings.email.smtp_password

        resp = await aiosmtplib.send(message, **kwargs)  # type: ignore
        logger.info(f"Email sent to {to} with subject {subject} ({now})")
        logger.debug(f"SMTP response: {resp}")


class ConsoleEmailService(EmailService):
    async def send(
        self,
        settings: Settings,
        to: str,
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        logger.info(f"EMAIL (console)\nTo: {to}\nSubject: {subject}\n\n{text}")


class DisabledEmailService(EmailService):
    async def send(
        self,
        settings: Settings,
        to: str,
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        logger.debug(f"Email disabled; skipping send to {to}")
