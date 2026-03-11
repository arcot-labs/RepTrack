import os
from functools import cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.models.schemas.config import (
    AdminSettings,
    DatabaseSettings,
    EmailConsoleSettings,
    EmailDisabledSettings,
    EmailLocalSettings,
    EmailSmtpSettings,
    GitHubApiSettings,
    GitHubConsoleSettings,
    JWTSettings,
)

EmailSettings = (
    EmailSmtpSettings
    | EmailLocalSettings
    | EmailConsoleSettings
    | EmailDisabledSettings
)
GitHubSettings = GitHubApiSettings | GitHubConsoleSettings


class Settings(BaseSettings):
    repo_name: str = "RepTrack"
    env: Literal["dev", "test", "stage", "prod"]
    log_level: Literal["debug", "info", "warning", "error", "critical"]
    client_url: str

    admin: AdminSettings
    jwt: JWTSettings
    db: DatabaseSettings
    # discriminator with any caps does not work
    email: Annotated[EmailSettings, Field(discriminator="backend")]
    gh: Annotated[GitHubSettings, Field(discriminator="backend")]

    @computed_field
    @property
    def project_name(self) -> str:
        if self.env == "prod":
            return self.repo_name
        return f"{self.repo_name}-{self.env.capitalize()}"

    @computed_field
    @property
    def is_prod_like(self) -> bool:
        return self.env == "stage" or self.env == "prod"

    @computed_field
    @property
    def cors_urls(self) -> list[str]:
        cors_urls = [self.client_url]
        if not self.is_prod_like:
            cors_urls.append("http://localhost")
        return cors_urls

    @computed_field
    @property
    def cookie_secure(self) -> bool:
        # must be False for pytest in test env
        return self.env != "test"

    @computed_field
    @property
    def cookie_same_site(self) -> Literal["lax", "none"]:
        return "lax" if self.is_prod_like else "none"

    @computed_field
    @property
    def data_dir(self) -> Path:
        path = Path("data")
        path = Path(os.getcwd()) / path
        return path.resolve()

    @computed_field
    @property
    def log_dir(self) -> Path:
        path = Path("logs")
        path = Path(os.getcwd()) / path
        return path.resolve()

    @model_validator(mode="after")
    def check_github_config(self):
        if self.is_prod_like and self.gh.backend != "api":
            raise ValueError("github backend must be 'api' in production")
        return self

    @model_validator(mode="after")
    def check_email_config(self):
        if self.is_prod_like and self.email.backend != "smtp":
            raise ValueError("email backend must be 'smtp' in production")
        return self

    model_config = SettingsConfigDict(
        env_file="../config/env/.env",
        # dot delimiter prevents loading in bash
        env_nested_delimiter="__",
        extra="ignore",
    )


# should only be used via Depends(...), except in create_app
@cache
def get_settings() -> Settings:
    return Settings()  # type: ignore
