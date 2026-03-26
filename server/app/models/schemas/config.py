from typing import Literal

from pydantic import BaseModel, computed_field


class AdminSettings(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str


class JWTSettings(BaseModel):
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int


class DatabaseSettings(BaseModel):
    host: str
    port: int
    name: str
    user: str
    password: str

    @computed_field
    @property
    def url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.user}:"
            f"{self.password}@{self.host}:"
            f"{self.port}/{self.name}"
        )


class MeilisearchSettings(BaseModel):
    host: str
    port: int
    master_key: str


class EmailSmtpSettings(BaseModel):
    backend: Literal["smtp"]
    # allow arbitrary string
    email_from: str
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str


class EmailLocalSettings(BaseModel):
    backend: Literal["local"]
    email_from: str
    smtp_host: str
    smtp_port: int

    @computed_field
    @property
    def smtp_username(self) -> None:
        return None

    @computed_field
    @property
    def smtp_password(self) -> None:
        return None


class EmailConsoleSettings(BaseModel):
    backend: Literal["console"]

    @computed_field
    @property
    def email_from(self) -> None:
        return None

    @computed_field
    @property
    def smtp_host(self) -> None:
        return None

    @computed_field
    @property
    def smtp_port(self) -> None:
        return None

    @computed_field
    @property
    def smtp_username(self) -> None:
        return None

    @computed_field
    @property
    def smtp_password(self) -> None:
        return None


class EmailDisabledSettings(BaseModel):
    backend: Literal["disabled"]

    @computed_field
    @property
    def email_from(self) -> None:
        return None

    @computed_field
    @property
    def smtp_host(self) -> None:
        return None

    @computed_field
    @property
    def smtp_port(self) -> None:
        return None

    @computed_field
    @property
    def smtp_username(self) -> None:
        return None

    @computed_field
    @property
    def smtp_password(self) -> None:
        return None


class GitHubApiSettings(BaseModel):
    backend: Literal["api"]
    repo_owner: str
    token: str
    issue_assignee: str


class GitHubConsoleSettings(BaseModel):
    backend: Literal["console"]

    @computed_field
    @property
    def repo_owner(self) -> None:
        return None

    @computed_field
    @property
    def token(self) -> None:
        return None

    @computed_field
    @property
    def issue_assignee(self) -> None:
        return None
