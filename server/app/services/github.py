import logging
from abc import ABC, abstractmethod
from typing import Annotated, Any

import httpx
from fastapi import Depends

from app.core.config import Settings, get_settings
from app.models.database.feedback import Feedback
from app.models.schemas.feedback import FeedbackType
from app.utilities.date import get_utc_timestamp_str

logger = logging.getLogger(__name__)


def get_github_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> GitHubService:
    match settings.gh.backend:
        case "api":
            return ApiGitHubService()
        case _:
            return ConsoleGitHubService()


class GitHubService(ABC):
    @abstractmethod
    async def create_feedback_issue(
        self, feedback: Feedback, settings: Settings
    ) -> None: ...


class ApiGitHubService(GitHubService):
    async def create_feedback_issue(self, feedback: Feedback, settings: Settings):
        logger.info(f"Creating GitHub issue for feedback id: {feedback.id}")

        repo_api_url = f"https://api.github.com/repos/{settings.gh.repo_owner}/{settings.repo_name}"
        url = f"{repo_api_url}/issues"
        headers = {
            "Authorization": f"Bearer {settings.gh.token}",
            "Accept": "application/vnd.github+json",
        }

        if feedback.type == FeedbackType.feedback:
            title = f"[Feedback] {feedback.title}"
        else:
            title = f"[Feature Request] {feedback.title}"

        body_lines = [
            "### Details",
            f"**Timestamp:** {get_utc_timestamp_str(feedback.created_at)}",
            f"**ID:** {feedback.id}",
            f"**User ID:** {feedback.user_id}",
            f"**URL:** {feedback.url}",
            "",
            "### Description",
            feedback.description,
        ]

        if feedback.files:
            body_lines.extend(
                [
                    "",
                    "### Attachments",
                ]
            )
            for file in feedback.files:
                body_lines.append(f"- {file.original_name} (`{file.path}`)")

        body = "\n".join(body_lines)
        payload: dict[str, Any] = {
            "title": title,
            "body": body,
            "assignees": [settings.gh.issue_assignee],
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, headers=headers, json=payload)
                resp.raise_for_status()
                logger.info(f"Created GitHub issue for feedback id: {feedback.id}")
            except httpx.HTTPStatusError as e:
                logger.error(
                    "Failed to create GitHub issue for feedback id %s - %s",
                    feedback.id,
                    e.response.text if e.response else "<no response>",
                )
            except Exception as e:
                logger.error(
                    "Unexpected error while creating GitHub issue for feedback id %s - %s",
                    feedback.id,
                    e,
                )


class ConsoleGitHubService(GitHubService):
    async def create_feedback_issue(self, feedback: Feedback, settings: Settings):
        logger.info(f"(Console) Creating GitHub issue for feedback id: {feedback.id}")
