from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.services.queries.set import select_sets

from ...exercise.utilities import create_exercise
from ...set.utilities import create_set
from ...utilities import create_user
from ...workout.utilities import create_workout
from ...workout_exercise.utilities import create_workout_exercise


async def test_select_sets_no_where_clause(
    db_session: AsyncSession,
):
    user = await create_user(db_session)
    exercise = await create_exercise(db_session, "Bench")
    workout = await create_workout(db_session, user_id=user.id, notes="Workout 1")
    workout_exercise = await create_workout_exercise(
        db_session=db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set_1 = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )
    set_2 = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=2,
    )

    sets = await select_sets(db_session)

    assert len(sets) == 2

    assert sets[0] == set_1
    assert sets[0].workout_exercise == workout_exercise

    assert sets[1] == set_2
    assert sets[1].workout_exercise == workout_exercise


async def test_select_sets_with_where_clause(
    db_session: AsyncSession,
):
    user = await create_user(db_session)
    exercise = await create_exercise(db_session, "Bench")
    workout = await create_workout(db_session, user_id=user.id, notes="Workout 1")
    workout_exercise = await create_workout_exercise(
        db_session=db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    set = await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
    )
    await create_set(
        db_session=db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=2,
    )

    sets = await select_sets(db_session, Set.id == set.id)

    assert len(sets) == 1
    assert sets[0] == set
    assert sets[0].workout_exercise == workout_exercise
