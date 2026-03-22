from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout_exercise import WorkoutExercise


async def create_workout_exercise(
    session: AsyncSession,
    workout_id: int,
    exercise_id: int,
    position: int,
) -> WorkoutExercise:
    workout_exercise = WorkoutExercise(
        workout_id=workout_id,
        exercise_id=exercise_id,
        position=position,
    )
    session.add(workout_exercise)
    await session.commit()
    await session.refresh(workout_exercise)
    return workout_exercise
