import pytest

from app.models.schemas.exercise import UpdateExerciseRequest


def test_update_exercise_request_null_name():
    with pytest.raises(ValueError, match="name cannot be null"):
        UpdateExerciseRequest(name=None)


def test_update_exercise_request_null_muscle_group_ids():
    with pytest.raises(ValueError, match="muscle_group_ids cannot be null"):
        UpdateExerciseRequest(muscle_group_ids=None)
