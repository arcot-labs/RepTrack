from httpx import AsyncClient, Response

from ..utilities import HttpMethod, make_http_request


async def reindex_via_api(
    client: AsyncClient,
    wait_for_tasks: bool = True,
) -> Response:
    return await make_http_request(
        client,
        method=HttpMethod.POST,
        endpoint="/api/search/reindex",
        json={"wait_for_tasks": wait_for_tasks},
    )
