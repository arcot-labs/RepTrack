from collections.abc import Callable
from typing import Any

import pytest

from app.core.config import Settings


@pytest.fixture
def override_settings(settings: Settings) -> Callable[[dict[str, Any]], Settings]:
    def _factory(overrides: dict[str, Any]) -> Settings:
        return settings.model_copy(update=overrides)

    return _factory
