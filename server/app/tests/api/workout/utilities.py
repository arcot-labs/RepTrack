from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout


async def create_workout(
    db_session: AsyncSession,
    user_id: int,
    started_at: datetime = datetime.now(),
    ended_at: datetime | None = None,
    notes: str | None = None,
) -> Workout:
    workout = Workout(
        user_id=user_id,
        started_at=started_at,
        ended_at=ended_at,
        notes=notes,
    )
    db_session.add(workout)
    await db_session.commit()
    await db_session.refresh(workout)
    return workout
