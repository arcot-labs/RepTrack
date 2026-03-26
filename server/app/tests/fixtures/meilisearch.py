from collections.abc import AsyncGenerator

import pytest
from meilisearch_python_sdk import AsyncClient
from testcontainers.core.container import (  # pyright: ignore[reportMissingTypeStubs]
    DockerContainer,
)
from testcontainers.core.wait_strategies import (  # pyright: ignore[reportMissingTypeStubs]
    LogMessageWaitStrategy,
)


@pytest.fixture(scope="session")
async def ms_container():
    with (
        DockerContainer("getmeili/meilisearch:v1.40.0")
        .with_exposed_ports(7700)
        .with_env("MEILI_MASTER_KEY", "masterkey")
        .waiting_for(LogMessageWaitStrategy("listening on:"))
    ) as container:
        host = container.get_container_host_ip()
        port = container.get_exposed_port(7700)
        yield host, port, "masterkey"


@pytest.fixture()
async def ms_client(
    ms_container: tuple[str, int, str],
) -> AsyncGenerator[AsyncClient]:
    host, port, master_key = ms_container

    client = AsyncClient(f"http://{host}:{port}", master_key)

    try:
        yield client
    finally:
        indexes = await client.get_indexes() or []
        for idx in indexes:
            await client.delete_index_if_exists(idx.uid)
