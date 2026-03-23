from decimal import Decimal
from typing import Annotated

from pydantic import EmailStr, Field, StringConstraints, TypeAdapter, ValidationError

EMAIL_TYPE_ADAPTER: TypeAdapter[EmailStr] = TypeAdapter(EmailStr)


def is_email_identifier(identifier: str) -> bool:
    try:
        EMAIL_TYPE_ADAPTER.validate_python(identifier)
        return True
    except ValidationError:
        return False


Name = Annotated[str, StringConstraints(min_length=1, max_length=255)]
Username = Annotated[str, StringConstraints(min_length=3, max_length=255)]
Password = Annotated[str, StringConstraints(min_length=8, max_length=64)]
Token = Annotated[str, StringConstraints(min_length=1, max_length=64)]
Email = Annotated[EmailStr, Field(max_length=255)]

FeedbackUrl = Annotated[str, Field(min_length=1, max_length=1000)]
FeedbackTitle = Annotated[str, Field(min_length=1, max_length=1000)]
FeedbackDescription = Annotated[str, Field(min_length=1, max_length=10000)]

ExerciseName = Annotated[str, StringConstraints(min_length=1, max_length=255)]
ExerciseDescription = Annotated[str, StringConstraints(max_length=1000)]

SetReps = Annotated[int, Field(ge=0)]
SetWeight = Annotated[Decimal, Field(max_digits=6, decimal_places=2, ge=0)]
SetNotes = Annotated[str, Field(max_length=1000)]

WorkoutExerciseNotes = Annotated[str, Field(max_length=1000)]

WorkoutNotes = Annotated[str, Field(max_length=1000)]
