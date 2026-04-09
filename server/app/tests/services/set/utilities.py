from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set


async def create_set(
    db_session: AsyncSession,
    workout_exercise_id: int,
    set_number: int,
    reps: int | None = None,
    weight: Decimal | None = None,
    unit: str | None = None,
    notes: str | None = None,
) -> Set:
    set_ = Set(
        workout_exercise_id=workout_exercise_id,
        set_number=set_number,
        reps=reps,
        weight=weight,
        unit=unit,
        notes=notes,
    )
    db_session.add(set_)
    await db_session.commit()
    await db_session.refresh(set_)
    return set_
