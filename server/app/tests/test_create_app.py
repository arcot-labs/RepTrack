from collections.abc import Callable
from typing import Any
from unittest.mock import Mock

import pytest

import app
from app.core.config import Settings


def test_create_app_prod(
    monkeypatch: pytest.MonkeyPatch,
    override_settings: Callable[[dict[str, Any]], Settings],
):
    setup_logging_mock = Mock()
    install_mock = Mock()

    monkeypatch.setattr("app.setup_logging", setup_logging_mock)
    monkeypatch.setattr("app.fsd.install", install_mock)

    settings = override_settings({"env": "prod"})
    fastapi_app, _ = app.create_app(settings)

    setup_logging_mock.assert_called_once_with(
        settings.log_dir,
        settings.env,
        settings.log_level,
    )
    assert fastapi_app.title == settings.repo_name
    assert fastapi_app.state.is_prod is True
    install_mock.assert_not_called()
