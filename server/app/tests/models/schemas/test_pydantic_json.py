from pydantic import BaseModel

from app.models.schemas.pydantic_json import PydanticJSON


class _Item(BaseModel):
    name: str
    value: int


def test_process_bind_param():
    type_adapter_none = PydanticJSON(_Item)

    type_adapter = PydanticJSON(_Item)
    items = [_Item(name="first", value=1), _Item(name="second", value=2)]

    assert type_adapter_none.process_bind_param(None, dialect=None) == []
    assert type_adapter.process_bind_param(items, dialect=None) == [
        {"name": "first", "value": 1},
        {"name": "second", "value": 2},
    ]


def test_process_result_value():
    type_adapter_none = PydanticJSON(_Item)

    type_adapter = PydanticJSON(_Item)
    raw_items = [{"name": "first", "value": 1}, {"name": "second", "value": 2}]
    result = type_adapter.process_result_value(raw_items, dialect=None)

    assert type_adapter_none.process_result_value(None, dialect=None) == []
    assert result == [_Item(name="first", value=1), _Item(name="second", value=2)]
