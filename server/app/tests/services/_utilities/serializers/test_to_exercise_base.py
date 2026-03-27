from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.schemas.exercise import ExerciseBase
from app.services.utilities.serializers import to_exercise_base


def test_to_exercise_base() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    exercise = Exercise(
        id=1,
        user_id=2,
        name="Bench Press",
        description="Flat bench",
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_exercise_base(exercise)

    assert isinstance(result, ExerciseBase)
    assert result.id == 1
    assert result.user_id == 2
    assert result.name == "Bench Press"
    assert result.description == "Flat bench"
    assert result.created_at == created_at
    assert result.updated_at == updated_at
