from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.workout import Workout


async def create_workout(
    session: AsyncSession,
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
    session.add(workout)
    await session.commit()
    await session.refresh(workout)
    return workout


# async def create_workout_exercise(
#     session: AsyncSession,
#     workout_id: int,
#     exercise_id: int,
#     position: int = 1,
#     notes: str | None = None,
# ) -> WorkoutExercise:
#     workout_exercise = WorkoutExercise(
#         workout_id=workout_id,
#         exercise_id=exercise_id,
#         position=position,
#         notes=notes,
#     )
#     session.add(workout_exercise)
#     await session.commit()
#     return workout_exercise


# async def create_set(
#     session: AsyncSession,
#     workout_exercise_id: int,
#     set_number: int = 1,
#     reps: int | None = None,
#     weight: float | None = None,
#     unit: str | None = None,
#     notes: str | None = None,
# ) -> Set:
#     set_ = Set(
#         workout_exercise_id=workout_exercise_id,
#         set_number=set_number,
#         reps=reps,
#         weight=weight,
#         unit=unit,
#         notes=notes,
#     )
#     session.add(set_)
#     await session.commit()
#     return set_


# async def create_workout_via_api(
#     client: AsyncClient,
#     started_at: str | None = None,
#     ended_at: str | None = None,
#     notes: str | None = None,
# ) -> WorkoutPublic:
#     resp = await make_http_request(
#         client,
#         method=HttpMethod.POST,
#         endpoint="/api/workouts",
#         json={
#             "started_at": started_at,
#             "ended_at": ended_at,
#             "notes": notes,
#         },
#     )
#     return WorkoutPublic.model_validate(resp.json())


# async def add_workout_exercise_via_api(
#     client: AsyncClient,
#     workout_id: int,
#     exercise_id: int,
#     notes: str | None = None,
# ) -> WorkoutExercisePublic:
#     resp = await make_http_request(
#         client,
#         method=HttpMethod.POST,
#         endpoint=f"/api/workouts/{workout_id}/exercises",
#         json={
#             "exercise_id": exercise_id,
#             "notes": notes,
#         },
#     )
#     return WorkoutExercisePublic.model_validate(resp.json())


# async def get_workout_exercise_count(session: AsyncSession, workout_id: int) -> int:
#     result = await session.execute(
#         select(WorkoutExercise).where(WorkoutExercise.workout_id == workout_id)
#     )
#     return len(result.scalars().all())
