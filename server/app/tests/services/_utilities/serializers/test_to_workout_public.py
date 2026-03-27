from datetime import UTC, datetime

from app.models.database.exercise import Exercise
from app.models.database.workout import Workout
from app.models.database.workout_exercise import WorkoutExercise
from app.models.schemas.workout import WorkoutPublic
from app.models.schemas.workout_exercise import WorkoutExercisePublic
from app.services.utilities.serializers import to_workout_public


def test_to_workout_public_no_exercises() -> None:
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

    result = to_workout_public(workout)

    assert isinstance(result, WorkoutPublic)
    assert result.id == 1
    assert result.user_id == 2
    assert result.started_at == started_at
    assert result.ended_at == ended_at
    assert result.notes == "Test workout"
    assert result.created_at == created_at
    assert result.updated_at == updated_at
    assert result.exercises == []


def test_to_workout_public_with_exercises() -> None:
    workout = Workout(
        id=1,
        user_id=2,
        started_at=datetime(2026, 1, 3, tzinfo=UTC),
        ended_at=datetime(2026, 1, 4, tzinfo=UTC),
        notes="Test workout",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        updated_at=datetime(2026, 1, 2, tzinfo=UTC),
    )
    exercise = Exercise(
        id=22,
        user_id=None,
        name="Bench Press",
        description="Flat bench",
        created_at=datetime(2026, 1, 1, tzinfo=UTC),
        updated_at=datetime(2026, 1, 2, tzinfo=UTC),
    )
    created_at = datetime(2026, 1, 5, tzinfo=UTC)
    updated_at = datetime(2026, 1, 6, tzinfo=UTC)
    workout.exercises = [
        WorkoutExercise(
            id=11,
            workout_id=1,
            exercise_id=22,
            position=1,
            exercise=exercise,
            created_at=created_at,
            updated_at=updated_at,
        )
    ]

    result = to_workout_public(workout)

    assert len(result.exercises) == 1
    assert isinstance(result.exercises[0], WorkoutExercisePublic)
    assert result.exercises[0].id == 11
    assert result.exercises[0].workout_id == 1
    assert result.exercises[0].exercise_id == 22
    assert result.exercises[0].position == 1
    assert result.exercises[0].created_at == created_at
    assert result.exercises[0].updated_at == updated_at
