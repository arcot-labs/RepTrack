from datetime import datetime
from typing import Self

from pydantic import BaseModel, model_validator

from .types import WorkoutNotes
from .workout_exercise import WorkoutExercisePublic


class WorkoutBase(BaseModel):
    id: int
    user_id: int
    started_at: datetime
    ended_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class WorkoutPublic(WorkoutBase):
    exercises: list[WorkoutExercisePublic]


class CreateWorkoutRequest(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None
    notes: WorkoutNotes | None = None


class UpdateWorkoutRequest(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None
    notes: WorkoutNotes | None = None

    @model_validator(mode="after")
    def validate_non_nullable_fields(self) -> Self:
        if "started_at" in self.model_fields_set and self.started_at is None:
            raise ValueError("started_at cannot be null")
        return self
