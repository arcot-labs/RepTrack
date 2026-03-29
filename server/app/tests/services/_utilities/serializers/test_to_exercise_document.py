from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.exercise import ExerciseDocument
from app.services.utilities.serializers import to_exercise_document


def test_to_exercise_document() -> None:
    exercise = Exercise(
        id=1,
        user_id=2,
        name="Bench Press",
        description="Flat bench",
    )

    result = to_exercise_document(exercise)

    assert isinstance(result, ExerciseDocument)
    assert result.id == 1
    assert result.user_id == 2
    assert result.name == "Bench Press"
    assert result.description == "Flat bench"
    assert result.muscle_group_names == []


def test_to_exercise_document_with_muscle_groups() -> None:
    chest = MuscleGroup(id=2, name="chest", description="Chest muscles")
    triceps = MuscleGroup(id=1, name="triceps", description="Triceps muscles")

    exercise = Exercise(
        id=11,
        user_id=None,
        name="Push-up",
        description=None,
        created_at=datetime(2026, 1, 3, tzinfo=UTC),
        updated_at=datetime(2026, 1, 4, tzinfo=UTC),
    )
    exercise.muscle_groups = [
        ExerciseMuscleGroup(exercise_id=11, muscle_group_id=2, muscle_group=chest),
        ExerciseMuscleGroup(exercise_id=11, muscle_group_id=1, muscle_group=triceps),
    ]

    result = to_exercise_document(exercise)

    # sorted by name
    assert result.muscle_group_names == ["chest", "triceps"]
