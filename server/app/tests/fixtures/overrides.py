import logging
from typing import Any, Callable

import pytest

from app.core.config import EmailSettings, Settings
from app.services.email import EmailService, get_email_service
from app.tests.fixtures.settings import TEST_SETTINGS

logger = logging.getLogger(__name__)


@pytest.fixture
def override_settings() -> Callable[[dict[str, Any]], Settings]:
    def _factory(overrides: dict[str, Any]) -> Settings:
        settings = TEST_SETTINGS.model_copy(update=overrides)
        return settings

    return _factory


@pytest.fixture
def override_email_settings() -> Callable[[EmailSettings], EmailService]:
    def _factory(email_settings: EmailSettings) -> EmailService:
        settings: Settings = TEST_SETTINGS.model_copy(update={"email": email_settings})
        service: EmailService = get_email_service(settings)
        return service

    return _factory
