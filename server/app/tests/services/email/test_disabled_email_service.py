from _pytest.logging import LogCaptureFixture

from app.services.email import DisabledEmailService


async def test_disabled_email_service_logs_skipped_send(
    anyio_backend: str, caplog: LogCaptureFixture
):
    _ = anyio_backend
    service = DisabledEmailService()

    caplog.set_level("DEBUG")
    await service.send(
        settings=None,  # type: ignore[arg-type]
        to="user@example.com",
        subject="Subject",
        text="Body",
    )

    assert any(
        "Email disabled; skipping send" in record.message for record in caplog.records
    )
