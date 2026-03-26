from meilisearch_python_sdk.models.search import SearchResults
from pydantic import BaseModel

from app.models.schemas.types import SearchQuery


class SearchRequest(BaseModel):
    query: SearchQuery
    limit: int = 25


class SearchResponse[T: BaseModel](BaseModel):
    query: str
    results: SearchResults[T]
