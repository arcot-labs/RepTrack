import importlib
import sys

import pytest

import app


def test_main_import_calls_create_app_and_exposes_instances(
    monkeypatch: pytest.MonkeyPatch,
):
    expected_fastapi_app = object()
    expected_asgi_app = object()
    create_app_calls = 0

    def mock_create_app():
        nonlocal create_app_calls
        create_app_calls += 1
        return expected_fastapi_app, expected_asgi_app

    monkeypatch.setattr(app, "create_app", mock_create_app)
    monkeypatch.delitem(sys.modules, "app.main", raising=False)

    main_module = importlib.import_module("app.main")

    assert create_app_calls == 1
    assert main_module.fastapi_app is expected_fastapi_app
    assert main_module.app is expected_asgi_app

    monkeypatch.delitem(sys.modules, "app.main", raising=False)
