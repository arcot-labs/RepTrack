from app.models.schemas.config import GitHubConsoleSettings


def test_github_console_settings_computed_fields_return_none():
    settings = GitHubConsoleSettings(backend="console")

    assert settings.repo_owner is None
    assert settings.token is None
    assert settings.issue_assignee is None
