from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.errors import WorkoutNotFound
from app.models.schemas.workout import UpdateWorkoutRequest
from app.services.workout import get_workout, update_workout

from ..utilities import create_user
from .utilities import create_workout


async def test_update_workout(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)

    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(
            started_at=started_at,
            ended_at=ended_at,
            notes="Updated notes",
        ),
        db_session,
    )

    assert workout.started_at == started_at
    assert workout.ended_at == ended_at
    assert workout.notes == "Updated notes"


async def test_update_workout_not_found(db_session: AsyncSession):
    user = await create_user(db_session)

    with pytest.raises(WorkoutNotFound):
        await update_workout(
            99999,
            user.id,
            UpdateWorkoutRequest(),
            db_session,
        )


async def test_update_workout_not_allowed(db_session: AsyncSession):
    user = await create_user(db_session)
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user.id)

    with pytest.raises(WorkoutNotFound):
        await update_workout(
            workout.id,
            user_2.id,
            UpdateWorkoutRequest(),
            db_session,
        )


async def test_update_workout_no_changes(db_session: AsyncSession):
    user = await create_user(db_session)
    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        started_at=started_at,
        ended_at=ended_at,
        notes="Test workout",
    )

    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(),
        db_session,
    )

    workout = await get_workout(workout.id, user.id, db_session)

    assert workout.started_at == started_at
    assert workout.ended_at == ended_at
    assert workout.notes == "Test workout"


async def test_update_workout_no_started_at(db_session: AsyncSession):
    user = await create_user(db_session)
    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        started_at=started_at,
        notes="Test workout",
    )

    new_ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(
            ended_at=new_ended_at,
            notes="Test workout updated",
        ),
        db_session,
    )

    workout = await get_workout(workout.id, user.id, db_session)

    assert workout.started_at == started_at
    assert workout.ended_at == new_ended_at
    assert workout.notes == "Test workout updated"


async def test_update_workout_no_ended_at(db_session: AsyncSession):
    user = await create_user(db_session)
    ended_at = datetime(2024, 1, 1, tzinfo=UTC)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        ended_at=ended_at,
        notes="Test workout",
    )

    new_started_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(
            started_at=new_started_at,
            notes="Test workout updated",
        ),
        db_session,
    )

    workout = await get_workout(workout.id, user.id, db_session)

    assert workout.started_at == new_started_at
    assert workout.ended_at == ended_at
    assert workout.notes == "Test workout updated"


async def test_update_workout_no_notes(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        notes="Test workout",
    )

    new_started_at = datetime(2024, 1, 1, tzinfo=UTC)
    new_ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(
            started_at=new_started_at,
            ended_at=new_ended_at,
        ),
        db_session,
    )

    workout = await get_workout(workout.id, user.id, db_session)

    assert workout.started_at == new_started_at
    assert workout.ended_at == new_ended_at
    assert workout.notes == "Test workout"


async def test_update_workout_null_values(db_session: AsyncSession):
    user = await create_user(db_session)
    started_at = datetime(2024, 1, 1, tzinfo=UTC)
    ended_at = datetime(2024, 1, 1, 1, tzinfo=UTC)
    workout = await create_workout(
        db_session,
        user_id=user.id,
        started_at=started_at,
        ended_at=ended_at,
        notes="Test workout",
    )

    await update_workout(
        workout.id,
        user.id,
        UpdateWorkoutRequest(
            ended_at=None,
            notes=None,
        ),
        db_session,
    )

    workout = await get_workout(workout.id, user.id, db_session)

    assert workout.started_at == started_at
    assert workout.ended_at is None
    assert workout.notes is None
