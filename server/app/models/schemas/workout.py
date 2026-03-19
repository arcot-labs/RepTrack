from datetime import datetime

from pydantic import BaseModel

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
    notes: str | None = None


class UpdateWorkoutRequest(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None
    notes: str | None = None
