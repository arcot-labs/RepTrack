from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup
from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.exercise import ExercisePublic
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.utilities.serializers import to_exercise_public


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

    result = to_exercise_public(exercise)

    assert isinstance(result, ExercisePublic)
    assert result.id == 1
    assert result.user_id == 2
    assert result.name == "Bench Press"
    assert result.description == "Flat bench"
    assert result.created_at == created_at
    assert result.updated_at == updated_at
    assert result.muscle_groups == []


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

    result = to_exercise_public(exercise)

    assert len(result.muscle_groups) == 2

    assert isinstance(result.muscle_groups[0], MuscleGroupPublic)
    assert result.muscle_groups[0].id == 1
    assert result.muscle_groups[0].name == "chest"
    assert result.muscle_groups[0].description == "Chest muscles"

    assert isinstance(result.muscle_groups[1], MuscleGroupPublic)
    assert result.muscle_groups[1].id == 2
    assert result.muscle_groups[1].name == "triceps"
    assert result.muscle_groups[1].description == "Triceps muscles"


def test_to_exercise_public_muscle_groups_ordering() -> None:
    back = MuscleGroup(id=3, name="back", description="Back muscles")
    arms = MuscleGroup(id=4, name="arms", description="Arm muscles")

    exercise = Exercise(
        id=12,
        user_id=None,
        name="Row",
        description=None,
        created_at=datetime(2026, 1, 5, tzinfo=UTC),
        updated_at=datetime(2026, 1, 6, tzinfo=UTC),
    )
    exercise.muscle_groups = [
        ExerciseMuscleGroup(exercise_id=12, muscle_group_id=3, muscle_group=back),
        ExerciseMuscleGroup(exercise_id=12, muscle_group_id=4, muscle_group=arms),
    ]

    result = to_exercise_public(exercise)

    assert [muscle_group.name for muscle_group in result.muscle_groups] == [
        "arms",
        "back",
    ]
