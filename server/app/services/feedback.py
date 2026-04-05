import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.database.feedback import Feedback
from app.models.schemas.feedback import CreateFeedbackRequest
from app.models.schemas.user import UserPublic
from app.services.github import GitHubService
from app.services.storage import store_files

logger = logging.getLogger(__name__)


async def create_feedback(
    user: UserPublic,
    req: CreateFeedbackRequest,
    db_session: AsyncSession,
    github_svc: GitHubService,
    settings: Settings,
):
    logger.info(f"Creating feedback from user {user.username} with title: {req.title}")

    feedback_dir = settings.data_dir / "feedback"

    stored_files = []
    if len(req.files) > 0:
        stored_files = await store_files(req.files, feedback_dir)

    feedback = Feedback(
        user_id=user.id,
        type=req.type,
        url=req.url,
        build=req.build,
        title=req.title,
        description=req.description,
        files=stored_files,
    )

    db_session.add(feedback)
    await db_session.commit()
    await db_session.refresh(feedback)

    await github_svc.create_feedback_issue(feedback, settings)

    logger.info(f"Stored feedback from user {user.username} with id: {feedback.id}")
