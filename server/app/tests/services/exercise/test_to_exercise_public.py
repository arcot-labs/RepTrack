from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.exercise import ExercisePublic
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.exercise import (
    _to_exercise_public,  # pyright: ignore[reportPrivateUsage]
)


def test_to_exercise_public_no_muscle_groups() -> None:
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

    result = _to_exercise_public(exercise)

    assert isinstance(result, ExercisePublic)
    assert result.id == 1
    assert result.user_id == 2
    assert result.name == "Bench Press"
    assert result.description == "Flat bench"
    assert result.muscle_groups == []
    assert result.created_at == created_at
    assert result.updated_at == updated_at


def test_to_exercise_public_with_muscle_groups() -> None:
    chest = MuscleGroup(id=1, name="chest", description="Chest muscles")
    triceps = MuscleGroup(id=2, name="triceps", description="Triceps muscles")

    exercise = Exercise(
        id=11,
        user_id=None,
        name="Push-up",
        description=None,
        created_at=datetime(2026, 1, 3, tzinfo=UTC),
        updated_at=datetime(2026, 1, 4, tzinfo=UTC),
    )
    exercise.muscle_groups = [
        ExerciseMuscleGroup(exercise_id=11, muscle_group_id=1, muscle_group=chest),
        ExerciseMuscleGroup(exercise_id=11, muscle_group_id=2, muscle_group=triceps),
    ]

    result = _to_exercise_public(exercise)

    assert len(result.muscle_groups) == 2

    assert isinstance(result.muscle_groups[0], MuscleGroupPublic)
    assert result.muscle_groups[0].id == 1
    assert result.muscle_groups[0].name == "chest"
    assert result.muscle_groups[0].description == "Chest muscles"

    assert isinstance(result.muscle_groups[1], MuscleGroupPublic)
    assert result.muscle_groups[1].id == 2
    assert result.muscle_groups[1].name == "triceps"
    assert result.muscle_groups[1].description == "Triceps muscles"
