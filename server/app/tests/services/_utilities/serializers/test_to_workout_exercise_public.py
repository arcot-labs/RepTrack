from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.database.set import Set
from app.models.database.workout_exercise import WorkoutExercise
from app.models.schemas.exercise import ExerciseBase
from app.models.schemas.set import SetPublic
from app.models.schemas.workout_exercise import WorkoutExercisePublic
from app.services.utilities.serializers import to_workout_exercise_public


def test_to_workout_exercise_public_no_sets() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    workout_exercise = WorkoutExercise(
        id=1,
        workout_id=2,
        exercise_id=3,
        position=4,
        notes="Test notes",
        created_at=created_at,
        updated_at=updated_at,
    )
    workout_exercise.exercise = Exercise(
        id=3,
        user_id=None,
        name="Squat",
        description="Barbell squat",
        created_at=created_at,
        updated_at=updated_at,
    )

    result = to_workout_exercise_public(workout_exercise)

    assert isinstance(result, WorkoutExercisePublic)
    assert result.id == 1
    assert result.workout_id == 2
    assert result.exercise_id == 3
    assert result.position == 4
    assert result.notes == "Test notes"
    assert result.created_at == created_at
    assert result.updated_at == updated_at

    exercise = result.exercise
    assert isinstance(exercise, ExerciseBase)
    assert exercise.id == 3
    assert exercise.user_id is None
    assert exercise.name == "Squat"
    assert exercise.description == "Barbell squat"
    assert exercise.created_at == created_at
    assert exercise.updated_at == updated_at


def test_to_workout_exercise_public_with_sets() -> None:
    created_at = datetime(2026, 1, 1, tzinfo=UTC)
    updated_at = datetime(2026, 1, 2, tzinfo=UTC)
    workout_exercise = WorkoutExercise(
        id=1,
        workout_id=2,
        exercise_id=3,
        position=4,
        notes="Test notes",
        created_at=created_at,
        updated_at=updated_at,
    )
    workout_exercise.exercise = Exercise(
        id=3,
        user_id=None,
        name="Squat",
        description="Barbell squat",
        created_at=created_at,
        updated_at=updated_at,
    )
    workout_exercise.sets = [
        Set(
            id=5,
            workout_exercise_id=1,
            set_number=1,
            reps=10,
            weight=100.0,
            unit="kg",
            notes="Set 1 notes",
            created_at=created_at,
            updated_at=updated_at,
        ),
        Set(
            id=6,
            workout_exercise_id=1,
            set_number=2,
            reps=12,
            weight=80.0,
            unit="kg",
            notes="Set 2 notes",
            created_at=created_at,
            updated_at=updated_at,
        ),
    ]

    result = to_workout_exercise_public(workout_exercise)

    sets = result.sets
    assert len(sets) == 2

    assert isinstance(sets[0], SetPublic)
    assert sets[0].id == 5
    assert sets[0].workout_exercise_id == 1
    assert sets[0].set_number == 1
    assert sets[0].reps == 10
    assert sets[0].weight == 100.0
    assert sets[0].unit == "kg"
    assert sets[0].notes == "Set 1 notes"
    assert sets[0].created_at == created_at
    assert sets[0].updated_at == updated_at

    assert isinstance(sets[1], SetPublic)
    assert sets[1].id == 6
    assert sets[1].workout_exercise_id == 1
    assert sets[1].set_number == 2
    assert sets[1].reps == 12
    assert sets[1].weight == 80.0
    assert sets[1].unit == "kg"
    assert sets[1].notes == "Set 2 notes"
    assert sets[1].created_at == created_at
    assert sets[1].updated_at == updated_at
