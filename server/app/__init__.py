import logging
from typing import Tuple

import fastapi_swagger_dark as fsd  # pyright: ignore[reportMissingTypeStubs]
from fastapi import APIRouter, FastAPI
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.cors import CORSMiddleware

from .api import api_router
from .core.config import Settings, get_settings
from .core.handlers import exception_handler
from .core.logging import setup_logging

logger = logging.getLogger(__name__)


def create_app(settings: Settings | None = None) -> Tuple[FastAPI, CORSMiddleware]:
    logger.info("Creating FastAPI app")

    settings = settings or get_settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.log_dir.mkdir(parents=True, exist_ok=True)

    setup_logging(settings.log_dir, settings.env, settings.log_level)

    logger.debug(f"Loaded settings: {settings.model_dump()}")
    logger.debug("Initialized logging")
    logger.info("Starting app...")

    title = settings.repo_name
    if settings.env != "prod":
        title += f" ({settings.env})"

    fastapi_app = FastAPI(
        title=title,
        docs_url=None,
        redoc_url=None,
    )

    # set for exception handler
    fastapi_app.state.is_prod = settings.is_prod_like

    fastapi_app.add_exception_handler(StarletteHTTPException, exception_handler)
    fastapi_app.add_exception_handler(Exception, exception_handler)

    router = APIRouter()
    router.include_router(api_router, prefix="/api")
    if not settings.is_prod_like:
        fsd.install(router)
    fastapi_app.include_router(router)

    # CORS headers are not included in error responses when using add_middleware for CORSMiddleware
    # https://github.com/fastapi/fastapi/discussions/8027#discussioncomment-5146484
    app = CORSMiddleware(
        app=fastapi_app,
        allow_origins=settings.cors_urls,
        allow_credentials=True,
        allow_methods=["*"],
    )

    return fastapi_app, app
