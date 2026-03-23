from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

from .muscle_group import MuscleGroupPublic
from .types import ExerciseName


class ExerciseBase(BaseModel):
    id: int
    user_id: int | None
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class ExercisePublic(ExerciseBase):
    muscle_groups: list[MuscleGroupPublic]


class CreateExerciseRequest(BaseModel):
    name: ExerciseName
    description: str | None = None
    muscle_group_ids: list[int] = Field(default_factory=list[int])


class UpdateExerciseRequest(BaseModel):
    name: ExerciseName | None = None
    description: str | None = None
    muscle_group_ids: list[int] | None = None

    @model_validator(mode="after")
    def validate_non_nullable_fields(self) -> Self:
        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("name cannot be null")
        if (
            "muscle_group_ids" in self.model_fields_set
            and self.muscle_group_ids is None
        ):
            raise ValueError("muscle_group_ids cannot be null")
        return self
