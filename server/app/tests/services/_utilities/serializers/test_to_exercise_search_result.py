from app.models.schemas.exercise import ExerciseDocument, ExerciseSearchResult
from app.services.utilities.serializers import to_exercise_search_result


def test_to_exercise_search_result() -> None:
    exercise = ExerciseDocument(
        id=1,
        user_id=2,
        name="Bench Press",
        description="Flat bench",
        muscle_group_names=["chest", "triceps"],
    )

    result = to_exercise_search_result(exercise)

    assert isinstance(result, ExerciseSearchResult)
    assert result.id == 1
