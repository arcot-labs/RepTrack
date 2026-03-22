from datetime import datetime

from pydantic import BaseModel

from app.models.schemas.exercise import ExerciseBase
from app.models.schemas.set import SetPublic


class WorkoutExercisePublic(BaseModel):
    id: int
    workout_id: int
    exercise_id: int
    position: int
    notes: str | None
    created_at: datetime
    updated_at: datetime

    exercise: ExerciseBase
    sets: list[SetPublic]


class CreateWorkoutExerciseRequest(BaseModel):
    exercise_id: int
    notes: str | None = None
