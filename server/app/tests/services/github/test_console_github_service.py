from _pytest.logging import LogCaptureFixture

from app.core.config import Settings
from app.models.enums import FeedbackType
from app.services.github import ConsoleGitHubService

from .utilities import feedback


async def test_console_github_service_create_feedback(
    anyio_backend: str, settings: Settings, caplog: LogCaptureFixture
):
    _ = anyio_backend
    service = ConsoleGitHubService()
    feedback_item = feedback(FeedbackType.feedback, with_files=False)
    feedback_item.id = 123

    await service.create_feedback_issue(feedback_item, settings)

    assert any(
        "(Console) Creating GitHub issue for feedback id: 123" in record.message
        for record in caplog.records
    )
