from app.models.database.set import Set
from app.models.schemas.set import SetPublic


def to_set_public(set_: Set) -> SetPublic:
    return SetPublic.model_validate(set_, from_attributes=True)
