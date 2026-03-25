from meilisearch_python_sdk.models.search import SearchResults
from pydantic import BaseModel
from pydantic.generics import GenericModel

from app.models.schemas.types import SearchQuery


class SearchRequest(BaseModel):
    query: SearchQuery
    limit: int


class SearchResponse[T: BaseModel](GenericModel):
    query: str
    results: SearchResults[T]
