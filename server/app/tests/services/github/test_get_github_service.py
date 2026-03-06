from collections.abc import Callable
from typing import Any

from app.core.config import GitHubConsoleSettings, Settings
from app.services.github import (
    ApiGitHubService,
    ConsoleGitHubService,
    get_github_service,
)

from .utilities import api_settings


def test_get_github_service_api(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = api_settings(override_settings)
    service = get_github_service(settings)

    assert isinstance(service, ApiGitHubService)


def test_get_github_service_console(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    settings = override_settings(
        {
            "gh": GitHubConsoleSettings(backend="console"),
        }
    )
    service = get_github_service(settings)

    assert isinstance(service, ConsoleGitHubService)
