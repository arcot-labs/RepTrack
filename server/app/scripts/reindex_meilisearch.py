import asyncio
import logging

from app.core.config import get_settings
from app.core.dependencies import build_ms_client, get_db_sessionmaker
from app.core.logging import setup_logging
from app.services.search import reindex

logger = logging.getLogger(__name__)


async def _run() -> None:
    settings = get_settings()
    settings.log_dir.mkdir(parents=True, exist_ok=True)
    setup_logging(settings.log_dir, settings.env, settings.log_level)

    sessionmaker = get_db_sessionmaker(
        settings.db.url,
        settings.is_prod_like,
    )
    ms_client = build_ms_client(
        settings.ms.host,
        settings.ms.port,
        settings.ms.master_key,
    )

    logger.info("Starting full Meilisearch reindex")

    async with sessionmaker() as db_session:
        await reindex(
            db_session=db_session,
            ms_client=ms_client,
        )

    logger.info("Finished full Meilisearch reindex")


if __name__ == "__main__":
    asyncio.run(_run())
