from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import SetUnit
from app.models.schemas.types import SetNotes, SetReps, SetWeight


class SetPublic(BaseModel):
    id: int
    workout_exercise_id: int
    set_number: int
    reps: int | None
    weight: Decimal | None
    unit: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class CreateSetRequest(BaseModel):
    reps: SetReps | None = None
    weight: SetWeight | None = None
    unit: SetUnit | None = None
    notes: SetNotes | None = None


class UpdateSetRequest(BaseModel):
    reps: SetReps | None = None
    weight: SetWeight | None = None
    unit: SetUnit | None = None
    notes: SetNotes | None = None
