from datetime import UTC, datetime

from app.models.database.set import Set
from app.models.schemas.set import SetPublic
from app.services.utilities.serializers import to_set_public


def test_to_set_public() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    set_ = Set(
        id=1,
        workout_exercise_id=2,
        set_number=3,
        reps=4,
        weight=5.5,
        unit="kg",
        notes="Test set",
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_set_public(set_)

    assert isinstance(result, SetPublic)
    assert result.id == 1
    assert result.workout_exercise_id == 2
    assert result.set_number == 3
    assert result.reps == 4
    assert result.weight == 5.5
    assert result.unit == "kg"
    assert result.notes == "Test set"
    assert result.created_at == created_at
    assert result.updated_at == updated_at
