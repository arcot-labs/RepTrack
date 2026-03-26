from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database.set import Set
from app.models.enums import SetUnit
from app.models.errors import (
    SetNotFound,
    WorkoutNotFound,
)
from app.models.schemas.set import UpdateSetRequest
from app.services.set import update_set

from ..exercise.utilities import create_exercise
from ..utilities import create_user
from ..workout.utilities import create_workout
from ..workout_exercise.utilities import create_workout_exercise
from .utilities import create_set


async def test_update_set(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            reps=12,
            weight=Decimal(150),
            unit=SetUnit.kg,
            notes="Updated set",
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 12
    assert set_.weight == 150
    assert set_.unit == "kg"
    assert set_.notes == "Updated set"


async def test_update_set_workout_not_found(db_session: AsyncSession):
    with pytest.raises(WorkoutNotFound):
        await update_set(
            workout_id=1,
            workout_exercise_id=2,
            set_id=3,
            user_id=4,
            req=UpdateSetRequest(),
            db_session=db_session,
        )


async def test_update_set_workout_not_allowed(db_session: AsyncSession):
    user_1 = await create_user(db_session, username="user_1")
    user_2 = await create_user(db_session, username="user_2")
    workout = await create_workout(db_session, user_id=user_2.id)

    with pytest.raises(WorkoutNotFound):
        await update_set(
            workout_id=workout.id,
            workout_exercise_id=2,
            set_id=3,
            user_id=user_1.id,
            req=UpdateSetRequest(),
            db_session=db_session,
        )


async def test_update_set_not_found(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )

    with pytest.raises(SetNotFound):
        await update_set(
            workout_id=workout.id,
            workout_exercise_id=workout_exercise.id,
            set_id=3,
            user_id=user.id,
            req=UpdateSetRequest(),
            db_session=db_session,
        )


async def test_update_set_no_changes(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 10
    assert set_.weight == 100
    assert set_.unit == "lb"
    assert set_.notes == "First set"


async def test_update_set_no_reps(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            weight=Decimal(150),
            unit=SetUnit.kg,
            notes="Updated set",
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 10
    assert set_.weight == 150
    assert set_.unit == "kg"
    assert set_.notes == "Updated set"


async def test_update_set_no_weight(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            reps=12,
            unit=SetUnit.kg,
            notes="Updated set",
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 12
    assert set_.weight == 100
    assert set_.unit == "kg"
    assert set_.notes == "Updated set"


async def test_update_set_no_unit(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            reps=12,
            weight=Decimal(150),
            notes="Updated set",
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 12
    assert set_.weight == 150
    assert set_.unit == "lb"
    assert set_.notes == "Updated set"


async def test_update_set_no_notes(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            reps=12,
            weight=Decimal(150),
            unit=SetUnit.kg,
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps == 12
    assert set_.weight == 150
    assert set_.unit == "kg"
    assert set_.notes == "First set"


async def test_update_set_null_values(db_session: AsyncSession):
    user = await create_user(db_session)
    workout = await create_workout(db_session, user_id=user.id)
    exercise = await create_exercise(db_session, name="Bench Press")
    workout_exercise = await create_workout_exercise(
        db_session,
        workout_id=workout.id,
        exercise_id=exercise.id,
        position=1,
    )
    set_ = await create_set(
        db_session,
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        reps=10,
        weight=100,
        unit="lb",
        notes="First set",
    )

    await update_set(
        workout_id=workout.id,
        workout_exercise_id=workout_exercise.id,
        set_id=set_.id,
        user_id=user.id,
        req=UpdateSetRequest(
            reps=None,
            weight=None,
            unit=None,
            notes=None,
        ),
        db_session=db_session,
    )

    set_ = await db_session.get(Set, set_.id)

    assert set_ is not None
    assert set_.reps is None
    assert set_.weight is None
    assert set_.unit is None
    assert set_.notes is None
