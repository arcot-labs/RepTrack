import logging
from typing import AsyncGenerator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncSession,
    AsyncTransaction,
)

from app import create_app
from app.core.config import Settings, get_settings
from app.core.dependencies import get_db
from app.services.email import EmailService, get_email_service
from app.services.github import GitHubService, get_github_service

logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def fastapi_app(settings: Settings) -> FastAPI:

    logger.info("Setting up test app")
    fastapi_app, _ = create_app(settings)
    return fastapi_app


@pytest.fixture()
async def client(
    fastapi_app: FastAPI,
    settings: Settings,
    connection: AsyncConnection,
    transaction: AsyncTransaction,
    mock_email_svc: EmailService,
    mock_github_svc: GitHubService,
) -> AsyncGenerator[AsyncClient, None]:
    logger.info("Setting up test client")

    async def override_get_settings() -> Settings:
        return settings

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async_session = AsyncSession(
            bind=connection,
            join_transaction_mode="create_savepoint",
            expire_on_commit=False,
        )
        async with async_session:
            yield async_session

    fastapi_app.dependency_overrides[get_settings] = override_get_settings
    fastapi_app.dependency_overrides[get_db] = override_get_db
    fastapi_app.dependency_overrides[get_email_service] = lambda: mock_email_svc
    fastapi_app.dependency_overrides[get_github_service] = lambda: mock_github_svc

    try:
        yield AsyncClient(
            transport=ASGITransport(app=fastapi_app), base_url="http://test"
        )
    finally:
        del fastapi_app.dependency_overrides[get_settings]
        del fastapi_app.dependency_overrides[get_db]
        del fastapi_app.dependency_overrides[get_email_service]
        del fastapi_app.dependency_overrides[get_github_service]

        if transaction.is_active:
            await transaction.rollback()
