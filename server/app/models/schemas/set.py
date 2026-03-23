from datetime import datetime

from pydantic import BaseModel

from app.models.schemas.types import SetReps, SetUnit, SetWeight


class SetPublic(BaseModel):
    id: int
    workout_exercise_id: int
    set_number: int
    reps: int | None
    weight: float | None
    unit: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class CreateSetRequest(BaseModel):
    reps: SetReps | None = None
    weight: SetWeight | None = None
    unit: SetUnit | None = None
    notes: str | None = None


class UpdateSetRequest(BaseModel):
    reps: SetReps | None = None
    weight: SetWeight | None = None
    unit: SetUnit | None = None
    notes: str | None = None
