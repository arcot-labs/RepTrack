import logging

from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.errors import MeilisearchTimeoutError

logger = logging.getLogger(__name__)


async def wait_for_task(client: AsyncClient, task_uid: int, timeout_in_ms: int = 5000):
    try:
        await client.wait_for_task(
            task_uid,
            timeout_in_ms=timeout_in_ms,
        )
    except MeilisearchTimeoutError:
        logger.error(f"Task {task_uid} did not complete within {timeout_in_ms} ms")
        raise
