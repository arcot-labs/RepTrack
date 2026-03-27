from httpx import AsyncClient

from ..utilities import HttpMethod, make_http_request


async def reindex_via_api(
    client: AsyncClient,
) -> None:
    await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/search/reindex",
    )
