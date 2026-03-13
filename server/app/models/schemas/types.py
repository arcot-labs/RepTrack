from typing import Annotated

from pydantic import EmailStr, Field, StringConstraints, TypeAdapter, ValidationError

EMAIL_TYPE_ADAPTER: TypeAdapter[EmailStr] = TypeAdapter(EmailStr)


def is_email_identifier(identifier: str) -> bool:
    try:
        EMAIL_TYPE_ADAPTER.validate_python(identifier)
        return True
    except ValidationError:
        return False


Name = Annotated[str, StringConstraints(min_length=1, max_length=50)]
Username = Annotated[str, StringConstraints(min_length=3, max_length=50)]
Password = Annotated[str, StringConstraints(min_length=8, max_length=64)]
Token = Annotated[str, StringConstraints(min_length=1, max_length=64)]
Email = Annotated[EmailStr, Field(max_length=255)]

ExerciseName = Annotated[str, StringConstraints(min_length=1, max_length=255)]
