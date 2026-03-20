from datetime import UTC, datetime

from app.models.database.workout import Workout
from app.models.schemas.workout import WorkoutBase
from app.services.workout import to_workout_base


def test_to_workout_base() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    started_at = datetime(2026, 1, 3, tzinfo=UTC)
    ended_at = datetime(2026, 1, 4, tzinfo=UTC)
    workout = Workout(
        id=1,
        user_id=2,
        started_at=started_at,
        ended_at=ended_at,
        notes="Test workout",
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_workout_base(workout)

    assert isinstance(result, WorkoutBase)
    assert result.id == 1
    assert result.user_id == 2
    assert result.started_at == started_at
    assert result.ended_at == ended_at
    assert result.notes == "Test workout"
    assert result.created_at == created_at
    assert result.updated_at == updated_at
