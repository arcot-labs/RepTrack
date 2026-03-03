import logging
from typing import Iterator

import pytest


@pytest.fixture
def restore_root_logger() -> Iterator[None]:
    root = logging.getLogger()
    previous_handlers = root.handlers[:]
    previous_level = root.level

    try:
        yield
    finally:
        for handler in root.handlers:
            if handler not in previous_handlers:
                handler.close()

        root.handlers = previous_handlers
        root.setLevel(previous_level)
