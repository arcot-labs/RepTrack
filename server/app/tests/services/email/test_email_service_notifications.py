from dataclasses import dataclass

from _pytest.logging import LogCaptureFixture

from app.core.config import Settings
from app.models.database.access_request import AccessRequest
from app.services.email import EmailService


@dataclass
class _SendCall:
    to: str
    subject: str
    text: str
    html: str | None


class _SpyEmailService(EmailService):
    def __init__(self, raise_error: bool = False):
        self.raise_error = raise_error
        self.calls: list[_SendCall] = []

    async def send(
        self,
        settings: Settings,
        to: str,
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        if self.raise_error:
            raise RuntimeError()
        self.calls.append(_SendCall(to=to, subject=subject, text=text, html=html))


def _access_request() -> AccessRequest:
    access_request = AccessRequest(
        email="requester@example.com",
        first_name="First",
        last_name="Last",
    )
    access_request.id = 42
    return access_request


async def test_send_access_request_notification(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    service = _SpyEmailService()

    await service.send_access_request_notification(
        settings=settings,
        admin_email="admin@example.com",
        access_request=_access_request(),
    )

    assert len(service.calls) == 1
    sent = service.calls[0]
    assert sent.to == "admin@example.com"
    assert "New Access Request" in sent.subject
    assert "request id 42" in sent.text
    assert sent.html is None


async def test_send_access_request_approved_email(
    anyio_backend: str, settings: Settings
):
    _ = anyio_backend
    service = _SpyEmailService()

    await service.send_access_request_approved_email(
        settings=settings,
        access_request=_access_request(),
        token="abc123",
    )

    assert len(service.calls) == 1
    sent = service.calls[0]
    assert sent.to == "requester@example.com"
    assert "Access Request Approved" in sent.subject
    assert "register?token=abc123" in sent.text
    assert sent.html is not None
    assert "register" in sent.html


async def test_send_access_request_rejected_email(
    anyio_backend: str, settings: Settings
):
    _ = anyio_backend
    service = _SpyEmailService()

    await service.send_access_request_rejected_email(
        settings=settings,
        access_request=_access_request(),
    )

    assert len(service.calls) == 1
    sent = service.calls[0]
    assert sent.to == "requester@example.com"
    assert "Access Request Rejected" in sent.subject
    assert "has been rejected" in sent.text
    assert sent.html is None


async def test_send_password_reset_email(anyio_backend: str, settings: Settings):
    _ = anyio_backend
    service = _SpyEmailService()

    await service.send_password_reset_email(
        settings=settings,
        email="reset@example.com",
        token="reset-token",
    )

    assert len(service.calls) == 1
    sent = service.calls[0]
    assert sent.to == "reset@example.com"
    assert "Password Reset" in sent.subject
    assert "reset-password?token=reset-token" in sent.text
    assert sent.html is not None
    assert "reset your password" in sent.html.lower()


async def test_send_error(
    anyio_backend: str, settings: Settings, caplog: LogCaptureFixture
):
    _ = anyio_backend
    service = _SpyEmailService(raise_error=True)
    access_request = _access_request()

    caplog.set_level("ERROR")

    await service.send_access_request_notification(
        settings=settings,
        admin_email="admin@example.com",
        access_request=access_request,
    )
    await service.send_access_request_approved_email(
        settings=settings,
        access_request=access_request,
        token="abc123",
    )
    await service.send_access_request_rejected_email(
        settings=settings,
        access_request=access_request,
    )
    await service.send_password_reset_email(
        settings=settings,
        email="reset@example.com",
        token="reset-token",
    )

    error_messages = [record.message for record in caplog.records]
    assert any(
        "Failed to send access request notification" in msg for msg in error_messages
    )
    assert any(
        "Failed to send access request approved email" in msg for msg in error_messages
    )
    assert any(
        "Failed to send access request rejected email" in msg for msg in error_messages
    )
    assert any("Failed to send password reset email" in msg for msg in error_messages)
