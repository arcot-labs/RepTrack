from pydantic import BaseModel

from app.models.schemas.types import SearchLimit, SearchQuery


class ReindexRequest(BaseModel):
    wait_for_tasks: bool


class SearchRequest(BaseModel):
    query: SearchQuery
    limit: SearchLimit
