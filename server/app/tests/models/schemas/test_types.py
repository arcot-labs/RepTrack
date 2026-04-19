from decimal import Decimal

import pytest
from pydantic import BaseModel, ValidationError

from app.models.schemas.types import (
    Email,
    ExerciseDescription,
    Name,
    Password,
    SearchLimit,
    SetWeight,
    Username,
    is_email_identifier,
)


def test_is_email_identifier_true():
    assert is_email_identifier("user@example.com") is True


def test_is_email_identifier_false():
    assert is_email_identifier("some_username") is False


class NameModel(BaseModel):
    name: Name  # type: ignore


def test_name_trimmed():
    m = NameModel(name="  Some Name  ")
    assert m.name == "Some Name"  # type: ignore


def test_name_rejects_empty_after_trim():
    with pytest.raises(ValidationError):
        NameModel(name="   ")


def test_name_max_length():
    with pytest.raises(ValidationError):
        NameModel(name="A" * 256)


class UsernameModel(BaseModel):
    username: Username  # type: ignore


def test_username_trimmed_and_lowered():
    m = UsernameModel(username="  Some_User  ")
    assert m.username == "some_user"  # type: ignore


class PasswordModel(BaseModel):
    password: Password  # type: ignore


def test_password_not_trimmed():
    m = PasswordModel(password="  secret_password  ")
    assert m.password == "  secret_password  "  # type: ignore


class EmailModel(BaseModel):
    email: Email  # type: ignore


def test_email_trimmed_and_lowered():
    m = EmailModel(email="  User.Name@Example.COM  ")
    assert m.email == "user.name@example.com"  # type: ignore


class ExerciseDescriptionModel(BaseModel):
    description: ExerciseDescription  # type: ignore


def test_exercise_description_allows_empty_after_trim():
    m = ExerciseDescriptionModel(description="   ")
    assert m.description == ""  # type: ignore


class SetWeightModel(BaseModel):
    weight: SetWeight  # type: ignore


@pytest.mark.parametrize("value", [Decimal("0.01"), Decimal("9999.99")])
def test_set_weight_accepts_valid_precision(value: Decimal):
    m = SetWeightModel(weight=value)
    assert m.weight == value  # type: ignore


@pytest.mark.parametrize("value", [Decimal("12345.67"), Decimal("1.234")])
def test_set_weight_rejects_invalid_precision(value: Decimal):
    with pytest.raises(ValidationError):
        SetWeightModel(weight=value)


class SearchLimitModel(BaseModel):
    limit: SearchLimit  # type: ignore


@pytest.mark.parametrize("value", [0, 1000])
def test_search_limit_accepts_boundary_values(value: int):
    m = SearchLimitModel(limit=value)
    assert m.limit == value  # type: ignore


@pytest.mark.parametrize("value", [-1, 1001])
def test_search_limit_rejects_out_of_range_values(value: int):
    with pytest.raises(ValidationError):
        SearchLimitModel(limit=value)
