import json
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import cast

from pythonjsonlogger.json import JsonFormatter

from app.core.config import Settings
from app.core.logging import setup_logging

logger = logging.getLogger(__name__)


def test_setup_logging_configures_root_handlers(
    anyio_backend: str,
    settings: Settings,
    tmp_path: Path,
    restore_root_logger: None,
):
    _ = anyio_backend
    _ = restore_root_logger

    log_dir = tmp_path / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    setup_logging(log_dir, settings.env, settings.log_level)

    root = logging.getLogger()

    assert root.level == logging.getLevelNamesMapping()[settings.log_level.upper()]
    assert len(root.handlers) == 2

    console_handler = root.handlers[0]
    assert isinstance(console_handler.formatter, JsonFormatter)

    file_handler = cast(RotatingFileHandler, root.handlers[1])
    assert isinstance(file_handler.formatter, JsonFormatter)
    assert file_handler.baseFilename == str(
        log_dir / f"reptrack_server_{settings.env}.log"
    )
    assert file_handler.encoding == "utf-8"
    assert file_handler.maxBytes == 1024 * 1024
    assert file_handler.backupCount == 5


def test_setup_logging_writes_json_logs_to_file(
    anyio_backend: str,
    tmp_path: Path,
    settings: Settings,
    restore_root_logger: None,
):
    _ = anyio_backend
    _ = restore_root_logger

    log_dir = tmp_path / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    setup_logging(log_dir, settings.env, settings.log_level)

    logger = logging.getLogger(__name__)
    logger.info("json log entry")

    root = logging.getLogger()
    for handler in root.handlers:
        handler.flush()

    log_file = log_dir / f"reptrack_server_{settings.env}.log"
    lines = log_file.read_text(encoding="utf-8").splitlines()

    payload = None
    for line in lines:
        parsed = json.loads(line)
        if parsed.get("message") == "json log entry":
            payload = parsed
            break

    assert payload is not None
    assert "time" in payload
    assert payload["level"] == "INFO"
    assert payload["logger"] == __name__
