from typing import Any, Generic, Sequence, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.types import JSON, TypeDecorator

T = TypeVar("T", bound=BaseModel)


class PydanticJSON(TypeDecorator[Any], Generic[T]):
    impl = JSON
    cache_ok = True

    def __init__(self, model: Type[T]) -> None:
        super().__init__()
        self.model: Type[T] = model

    def process_bind_param(
        self,
        value: Sequence[T] | None,
        dialect: Dialect | None,
    ) -> list[dict[str, Any]] | None:
        _ = dialect
        if value is None:
            return []
        return [v.model_dump() for v in value]

    def process_result_value(
        self,
        value: list[dict[str, Any]] | None,
        dialect: Dialect | None,
    ) -> list[T]:
        _ = dialect
        if value is None:
            return []
        return [self.model.model_validate(v) for v in value]
