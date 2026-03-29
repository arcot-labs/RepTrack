from app.models.schemas.muscle_group import MuscleGroupPublic, MuscleGroupSearchResult
from app.services.utilities.serializers import to_muscle_group_search_result


def test_to_muscle_group_search_result() -> None:
    mg = MuscleGroupPublic(
        id=1,
        name="chest",
        description="Chest muscles",
    )

    result = to_muscle_group_search_result(mg)

    assert isinstance(result, MuscleGroupSearchResult)
    assert result.id == 1
