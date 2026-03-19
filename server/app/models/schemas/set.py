from datetime import datetime

from pydantic import BaseModel


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
