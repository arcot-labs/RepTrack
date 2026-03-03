from fastapi import status
from httpx import AsyncClient


# 200
async def test_health(client: AsyncClient):
    resp = await client.get("/api/health")

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert body == "ok"
