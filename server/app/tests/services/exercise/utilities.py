from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup


async def create_exercise(
    db_session: AsyncSession,
    name: str,
    user_id: int | None = None,
    description: str | None = None,
    muscle_group_ids: list[int] | None = None,
) -> Exercise:
    exercise = Exercise(
        user_id=user_id,
        name=name,
        description=description,
    )
    db_session.add(exercise)
    await db_session.flush()

    for muscle_group_id in muscle_group_ids or []:
        db_session.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=muscle_group_id,
            )
        )

    await db_session.commit()
    return exercise
