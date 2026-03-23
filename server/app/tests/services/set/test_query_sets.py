from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.services.set import query_sets

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout
from ..workout_exercise.utilities import create_workout_exercise
from .utilities import create_set


async def test_query_sets_no_where_clause(
    session: AsyncSession,
):
    user = await create_user(session)
    exercise = await create_exercise(session, "Bench")
    workout = await create_workout(session, user_id=user.id, notes="Workout 1")
    workout_exercise = await create_workout_exercise(
        session=session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set_1 = await create_set(
        session=session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )
    set_2 = await create_set(
        session=session,
        workout_exercise_id=workout_exercise.id,
        set_number=2,
    )

    sets = await query_sets(session)

    assert len(sets) == 2

    assert sets[0] == set_1
    assert sets[0].workout_exercise == workout_exercise

    assert sets[1] == set_2
    assert sets[1].workout_exercise == workout_exercise


async def test_query_sets_with_where_clause(
    session: AsyncSession,
):
    user = await create_user(session)
    exercise = await create_exercise(session, "Bench")
    workout = await create_workout(session, user_id=user.id, notes="Workout 1")
    workout_exercise = await create_workout_exercise(
        session=session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set = await create_set(
        session=session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )
    await create_set(
        session=session,
        workout_exercise_id=workout_exercise.id,
        set_number=2,
    )

    sets = await query_sets(session, Set.id == set.id)

    assert len(sets) == 1
    assert sets[0] == set
    assert sets[0].workout_exercise == workout_exercise
