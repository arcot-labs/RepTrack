from datetime import datetime

from pydantic import BaseModel, Field

from .muscle_group import MuscleGroupPublic
from .types import ExerciseName


class ExercisePublic(BaseModel):
    id: int
    user_id: int | None
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    muscle_groups: list[MuscleGroupPublic]


class CreateExerciseRequest(BaseModel):
    name: ExerciseName
    description: str | None = None
    muscle_group_ids: list[int] = Field(default_factory=list[int])


class UpdateExerciseRequest(BaseModel):
    name: ExerciseName | None = None
    description: str | None = None
    muscle_group_ids: list[int] | None = None
