import pytest
from pydantic_settings import SettingsConfigDict

from app.core.config import (
    AdminSettings,
    DatabaseSettings,
    EmailConsoleSettings,
    GitHubConsoleSettings,
    JWTSettings,
    Settings,
)

TEST_ADMIN_SETTINGS = AdminSettings(
    username="admin",
    email="admin@example.com",
    first_name="Admin",
    last_name="User",
    password="password",
)
TEST_JWT_SETTINGS = JWTSettings(
    secret_key="super-long-and-secure-secret-key",
    algorithm="HS256",
    access_token_expire_minutes=30,
    refresh_token_expire_days=7,
)
TEST_DB_SETTINGS = DatabaseSettings(
    host="localhost",
    port=5432,
    name="reptrack_test",
    user="test",
    password="pw",
)
TEST_EMAIL_SETTINGS = EmailConsoleSettings(
    backend="console",
)
TEST_GH_SETTINGS = GitHubConsoleSettings(
    backend="console",
)
TEST_SETTINGS = Settings(
    env="test",
    log_level="debug",
    client_url="http://test",
    admin=TEST_ADMIN_SETTINGS,
    jwt=TEST_JWT_SETTINGS,
    db=TEST_DB_SETTINGS,
    email=TEST_EMAIL_SETTINGS,
    gh=TEST_GH_SETTINGS,
)


@pytest.fixture(autouse=True)
def disable_env_file(monkeypatch: pytest.MonkeyPatch):
    config = dict(Settings.model_config)
    config["env_file"] = None
    monkeypatch.setattr(
        Settings,
        "model_config",
        SettingsConfigDict(**config),  # pyright: ignore[reportArgumentType]
    )


@pytest.fixture(scope="session")
def settings() -> Settings:
    return TEST_SETTINGS
