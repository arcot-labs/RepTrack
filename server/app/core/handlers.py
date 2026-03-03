import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


async def exception_handler(request: Request, exc: Exception):
    is_prod: bool = getattr(request.app.state, "is_prod", True)

    if isinstance(exc, StarletteHTTPException):
        logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")

        if isinstance(exc.detail, dict):
            # pass through custom HTTPError
            content = exc.detail

        else:
            detail = "HTTP Error"
            if (not is_prod) and exc.detail:
                detail = exc.detail

            content = {
                "detail": detail,
                "code": "http_error",
            }

        return JSONResponse(
            status_code=exc.status_code,
            content=content,
        )

    logger.exception(f"Unhandled error: {exc}")

    detail = "Internal Server Error"
    if not is_prod:
        detail = str(exc) or detail

    return JSONResponse(
        status_code=500,
        content={
            "detail": detail,
            "code": "internal_server_error",
        },
    )
