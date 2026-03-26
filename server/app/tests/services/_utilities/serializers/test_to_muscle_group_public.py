from app.models.database.muscle_group import MuscleGroup
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.services.utilities.serializers import to_muscle_group_public


def test_to_muscle_group_public() -> None:
    mg = MuscleGroup(
        id=1,
        name="Chest",
        description="Chest muscles",
    )

    result = to_muscle_group_public(mg)

    assert isinstance(result, MuscleGroupPublic)
    assert result.id == 1
    assert result.name == "Chest"
    assert result.description == "Chest muscles"

    result = to_muscle_group_public(mg)

    assert isinstance(result, MuscleGroupPublic)
    assert result.id == 1
    assert result.name == "Chest"
    assert result.description == "Chest muscles"
