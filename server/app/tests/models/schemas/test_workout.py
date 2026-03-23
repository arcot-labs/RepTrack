import pytest

from app.models.schemas.workout import UpdateWorkoutRequest


def test_update_workout_request_null_started_at():
    with pytest.raises(ValueError, match="started_at cannot be null"):
        UpdateWorkoutRequest(started_at=None)
