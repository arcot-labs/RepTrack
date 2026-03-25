from meilisearch_python_sdk import AsyncClient

from app.core.config import Settings
from app.core.dependencies import get_ms_client


async def test_get_ms_client(anyio_backend: str, settings: Settings):
    _ = anyio_backend

    client = await get_ms_client(settings)
    assert isinstance(client, AsyncClient)

    url = f"http://{settings.ms.host}:{settings.ms.port}"
    assert client.http_client.base_url == url

    headers = {"Authorization": f"Bearer {settings.ms.master_key}"}
    assert client._headers == headers  # pyright: ignore[reportPrivateUsage]
