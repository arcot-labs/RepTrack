from typing import Any, Callable

import pytest

from app.core.config import (
    EmailConsoleSettings,
    EmailLocalSettings,
    EmailSmtpSettings,
    GitHubApiSettings,
    GitHubConsoleSettings,
    Settings,
    get_settings,
)
from app.tests.fixtures.settings import TEST_SETTINGS

MOCK_CLIENT_URL = "http://example.com"
LOCALHOST_URL = "http://localhost"


def _revalidate_settings(settings: Settings) -> Settings:
    return Settings.model_validate(settings.model_dump(warnings=False))


def test_dev_config(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "dev",
        "client_url": MOCK_CLIENT_URL,
    }
    settings = override_settings(overrides)
    settings = _revalidate_settings(settings)

    assert settings.env == "dev"
    assert settings.client_url == MOCK_CLIENT_URL

    assert isinstance(settings.email, EmailConsoleSettings)
    assert isinstance(settings.gh, GitHubConsoleSettings)

    assert settings.project_name == "RepTrack-Dev"
    assert settings.is_prod_like is False
    assert settings.client_url == MOCK_CLIENT_URL
    assert settings.cors_urls == [MOCK_CLIENT_URL, LOCALHOST_URL]
    assert settings.cookie_secure is True
    assert settings.cookie_same_site == "none"
    assert settings.data_dir.name == "data"
    assert settings.data_dir.is_absolute()
    assert settings.log_dir.name == "logs"
    assert settings.log_dir.is_absolute()


def test_test_config(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "test",
        "client_url": MOCK_CLIENT_URL,
        "email": {
            "backend": "local",
            "email_from": "noreply@example.com",
            "smtp_host": "host",
            "smtp_port": 25,
        },
    }
    settings = override_settings(overrides)
    settings = _revalidate_settings(settings)

    assert settings.env == "test"
    assert settings.client_url == MOCK_CLIENT_URL

    assert isinstance(settings.email, EmailLocalSettings)
    assert isinstance(settings.gh, GitHubConsoleSettings)

    assert settings.project_name == "RepTrack-Test"
    assert settings.is_prod_like is False
    assert settings.client_url == MOCK_CLIENT_URL
    assert settings.cors_urls == [MOCK_CLIENT_URL, LOCALHOST_URL]
    assert settings.cookie_secure is False
    assert settings.cookie_same_site == "none"
    assert settings.data_dir.name == "data"
    assert settings.data_dir.is_absolute()
    assert settings.log_dir.name == "logs"
    assert settings.log_dir.is_absolute()


def test_stage_config(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "stage",
        "client_url": MOCK_CLIENT_URL,
        "email": {
            "backend": "smtp",
            "email_from": "noreply@example.com",
            "smtp_host": "host",
            "smtp_port": 25,
            "smtp_username": "user",
            "smtp_password": "pass",
        },
        "gh": {
            "backend": "api",
            "repo_owner": "owner",
            "token": "token",
            "issue_assignee": "assignee",
        },
    }
    settings = override_settings(overrides)
    settings = _revalidate_settings(settings)

    assert settings.env == "stage"
    assert settings.client_url == MOCK_CLIENT_URL

    assert isinstance(settings.email, EmailSmtpSettings)
    assert isinstance(settings.gh, GitHubApiSettings)

    assert settings.project_name == "RepTrack-Stage"
    assert settings.is_prod_like is True
    assert settings.client_url == MOCK_CLIENT_URL
    assert settings.cors_urls == [MOCK_CLIENT_URL]
    assert settings.cookie_secure is True
    assert settings.cookie_same_site == "lax"
    assert settings.data_dir.name == "data"
    assert settings.data_dir.is_absolute()
    assert settings.log_dir.name == "logs"
    assert settings.log_dir.is_absolute()


def test_prod_config(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "prod",
        "client_url": MOCK_CLIENT_URL,
        "email": {
            "backend": "smtp",
            "email_from": "noreply@example.com",
            "smtp_host": "host",
            "smtp_port": 25,
            "smtp_username": "user",
            "smtp_password": "pass",
        },
        "gh": {
            "backend": "api",
            "repo_owner": "owner",
            "token": "token",
            "issue_assignee": "assignee",
        },
    }
    settings = override_settings(overrides)
    settings = _revalidate_settings(settings)

    assert settings.env == "prod"
    assert settings.client_url == MOCK_CLIENT_URL

    assert isinstance(settings.email, EmailSmtpSettings)
    assert isinstance(settings.gh, GitHubApiSettings)

    assert settings.project_name == "RepTrack"
    assert settings.is_prod_like is True
    assert settings.client_url == MOCK_CLIENT_URL
    assert settings.cors_urls == [MOCK_CLIENT_URL]
    assert settings.cookie_secure is True
    assert settings.cookie_same_site == "lax"
    assert settings.data_dir.name == "data"
    assert settings.data_dir.is_absolute()
    assert settings.log_dir.name == "logs"
    assert settings.log_dir.is_absolute()


def test_prod_gh_validator_raises_for_wrong_backend(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "prod",
        "email": {
            "backend": "smtp",
            "email_from": "noreply@example.com",
            "smtp_host": "host",
            "smtp_port": 25,
            "smtp_username": "user",
            "smtp_password": "pass",
        },
        "gh": {"backend": "console"},
    }
    settings = override_settings(overrides)

    with pytest.raises(ValueError, match="github.backend must be 'api' in production"):
        _revalidate_settings(settings)


def test_prod_email_validator_raises_for_wrong_backend(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "prod",
        "gh": {
            "backend": "api",
            "repo_owner": "owner",
            "token": "token",
            "issue_assignee": "assignee",
        },
        "email": {"backend": "console"},
    }
    settings = override_settings(overrides)

    with pytest.raises(ValueError, match="email.backend must be 'smtp' in production"):
        _revalidate_settings(settings)


def test_gh_backend_fails_with_missing_properties(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "dev",
        "gh": {"backend": "api"},
        "email": {"backend": "console"},
    }
    settings = override_settings(overrides)

    with pytest.raises(ValueError, match="3 validation errors"):
        _revalidate_settings(settings)


def test_email_backend_fails_with_missing_properties(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "prod",
        "gh": {"backend": "console"},
        "email": {"backend": "smtp"},
    }
    settings = override_settings(overrides)

    with pytest.raises(ValueError, match="5 validation errors"):
        _revalidate_settings(settings)


def test_extra_field_ignored(
    override_settings: Callable[[dict[str, Any]], Settings],
):
    overrides: dict[str, Any] = {
        "env": "dev",
        "extra_field": "ignored",
    }
    settings = override_settings(overrides)
    settings = _revalidate_settings(settings)

    assert not hasattr(settings, "extra_field")


def test_get_settings_returns_settings_instance(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("app.core.config.Settings", lambda: TEST_SETTINGS)
    get_settings.cache_clear()
    settings = get_settings()
    get_settings.cache_clear()

    assert isinstance(settings, Settings)


def test_get_settings_is_cached(monkeypatch: pytest.MonkeyPatch) -> None:
    call_count = 0

    def fake_settings() -> Settings:
        nonlocal call_count
        call_count += 1
        return TEST_SETTINGS.model_copy(deep=True)

    monkeypatch.setattr("app.core.config.Settings", fake_settings)
    get_settings.cache_clear()
    first = get_settings()
    second = get_settings()
    get_settings.cache_clear()

    assert first is second
    assert call_count == 1
