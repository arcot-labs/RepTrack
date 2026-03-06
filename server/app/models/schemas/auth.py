from typing import Self

from pydantic import BaseModel, model_validator

from app.models.schemas.types import Email, Name, Password, Token, Username


class RequestAccessRequest(BaseModel):
    email: Email
    first_name: Name
    last_name: Name


class RegisterRequest(BaseModel):
    token: Token
    username: Username
    password: Password


class ForgotPasswordRequest(BaseModel):
    email: Email


class ResetPasswordRequest(BaseModel):
    token: Token
    password: Password


class LoginRequest(BaseModel):
    username: Username | None = None
    email: Email | None = None
    password: Password

    @model_validator(mode="after")
    def validate_login_identifier(self) -> Self:
        if not self.username and not self.email:
            raise ValueError("At least one of username or email must be provided")
        return self

    @property
    def identifier(self) -> str:
        return self.username or str(self.email)
