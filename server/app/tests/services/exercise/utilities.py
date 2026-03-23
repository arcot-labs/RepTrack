from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.exercise import Exercise
from app.models.database.exercise_muscle_group import ExerciseMuscleGroup


async def create_exercise(
    session: AsyncSession,
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
    session.add(exercise)
    await session.flush()

    for muscle_group_id in muscle_group_ids or []:
        session.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=muscle_group_id,
            )
        )

    await session.commit()
    return exercise
