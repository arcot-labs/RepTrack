from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout


async def create_workout(
    session: AsyncSession,
    user_id: int,
    started_at: datetime | None = None,
    ended_at: datetime | None = None,
    notes: str | None = None,
) -> Workout:
    workout = Workout(
        user_id=user_id,
        started_at=started_at or datetime.now(UTC),
        ended_at=ended_at,
        notes=notes,
    )
    session.add(workout)
    await session.commit()
    await session.refresh(workout)
    return workout
