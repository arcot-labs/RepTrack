from pydantic import BaseModel


class MuscleGroupPublic(BaseModel):
    id: int
    name: str
    description: str


class MuscleGroupSearchResult(BaseModel):
    id: int
