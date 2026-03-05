from _pytest.logging import LogCaptureFixture

from app.services.email import ConsoleEmailService


async def test_console_email_service_logs_email(
    anyio_backend: str, caplog: LogCaptureFixture
):
    _ = anyio_backend
    service = ConsoleEmailService()

    await service.send(
        settings=None,  # type: ignore[arg-type]
        to="user@example.com",
        subject="Subject",
        text="Body",
    )

    assert any("EMAIL (console)" in record.message for record in caplog.records)
