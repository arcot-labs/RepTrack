import logging
from typing import Any, Callable

import pytest

from app.core.config import EmailSettings, Settings
from app.services.email import EmailService, get_email_service

logger = logging.getLogger(__name__)


@pytest.fixture
def override_settings(settings: Settings) -> Callable[[dict[str, Any]], Settings]:
    def _factory(overrides: dict[str, Any]) -> Settings:
        return settings.model_copy(update=overrides)

    return _factory


@pytest.fixture
def override_email_settings(
    settings: Settings,
) -> Callable[[EmailSettings], EmailService]:
    def _factory(email_settings: EmailSettings) -> EmailService:
        updated_settings = settings.model_copy(update={"email": email_settings})
        service: EmailService = get_email_service(updated_settings)
        return service

    return _factory
