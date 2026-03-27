from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from app.core.dependencies import get_db_session

api_router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@api_router.get("", operation_id="getHealth")
def get_health_endpoint() -> str:
    return "ok"


@api_router.get("/db", operation_id="getDbHealth")
async def get_db_health_endpoint(
    db_session: Annotated[AsyncSession, Depends(get_db_session)],
) -> str:
    await db_session.execute(text("SELECT 1"))
    return "ok"
