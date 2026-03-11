from datetime import datetime

from pydantic import BaseModel

from .muscle_group import MuscleGroupPublic
from .types import ExerciseName


class ExercisePublic(BaseModel):
    id: int
    user_id: int | None
    name: str
    description: str | None
    muscle_groups: list[MuscleGroupPublic]
    created_at: datetime
    updated_at: datetime


class CreateExerciseRequest(BaseModel):
    name: ExerciseName
    description: str | None = None
    muscle_group_ids: list[int] = []


class UpdateExerciseRequest(BaseModel):
    name: ExerciseName | None = None
    description: str | None = None
    muscle_group_ids: list[int] | None = None
