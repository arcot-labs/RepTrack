from typing import Self

from pydantic import (
    BaseModel,
    EmailStr,
    TypeAdapter,
    ValidationError,
    field_validator,
    model_validator,
)

from app.models.schemas.types import Email, Name, Password, Token, Username

EMAIL_TYPE_ADAPTER: TypeAdapter[EmailStr] = TypeAdapter(EmailStr)


class RequestAccessRequest(BaseModel):
    email: Email
    first_name: Name
    last_name: Name


class RegisterRequest(BaseModel):
    token: Token
    username: Username
    password: Password

    @field_validator("username")
    @classmethod
    def validate_username_not_email(cls, value: str) -> str:
        try:
            EMAIL_TYPE_ADAPTER.validate_python(value)
        except ValidationError:
            return value
        raise ValueError("Username cannot be an email address")


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
