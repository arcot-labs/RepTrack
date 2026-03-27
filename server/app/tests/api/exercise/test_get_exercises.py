from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.schemas.exercise import ExercisePublic
from app.tests.api.exercise.utilities import (
    create_exercise,
    create_exercise_via_api,
    create_system_exercise,
)

from ..utilities import HttpMethod, create_user, login_admin, make_http_request


async def _make_request(client: AsyncClient):
    return await make_http_request(
        client,
        method=HttpMethod.GET,
        endpoint="/api/exercises",
    )


# 200
async def test_get_exercises(
    client: AsyncClient,
    db_session: AsyncSession,
    settings: Settings,
):
    await login_admin(client, settings)
    user = await create_user(db_session)

    await create_system_exercise(db_session, name="System Exercise")
    await create_exercise_via_api(client, db_session, name="User Exercise")
    await create_exercise(
        db_session,
        name="Another User's Exercise",
        user_id=user.id,
    )

    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_200_OK
    body = resp.json()
    assert isinstance(body, list)
    names = [ExercisePublic.model_validate(e).name for e in body]  # pyright: ignore[reportUnknownVariableType]
    assert "System Exercise" in names
    assert "User Exercise" in names
    assert "Another User's Exercise" not in names


# 401
async def test_get_exercises_not_logged_in(client: AsyncClient):
    resp = await _make_request(client)

    assert resp.status_code == status.HTTP_401_UNAUTHORIZED
    body = resp.json()
    assert body["detail"] == "Not authenticated"
