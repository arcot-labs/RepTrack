from app.models.database.access_request import AccessRequest
from app.models.database.exercise import Exercise
from app.models.database.muscle_group import MuscleGroup
from app.models.database.set import Set
from app.models.database.user import User
from app.models.database.workout import Workout
from app.models.database.workout_exercise import WorkoutExercise
from app.models.schemas.access_request import AccessRequestPublic, ReviewerPublic
from app.models.schemas.exercise import ExerciseBase, ExercisePublic
from app.models.schemas.muscle_group import MuscleGroupPublic
from app.models.schemas.set import SetPublic
from app.models.schemas.user import UserPublic
from app.models.schemas.workout import WorkoutBase, WorkoutPublic
from app.models.schemas.workout_exercise import WorkoutExercisePublic


def to_access_request_public(access_request: AccessRequest) -> AccessRequestPublic:
    reviewer = (
        ReviewerPublic(
            id=access_request.reviewer.id,
            username=access_request.reviewer.username,
        )
        if access_request.reviewer
        else None
    )
    return AccessRequestPublic(
        id=access_request.id,
        email=access_request.email,
        first_name=access_request.first_name,
        last_name=access_request.last_name,
        status=access_request.status,
        reviewed_at=access_request.reviewed_at,
        reviewer=reviewer,
        created_at=access_request.created_at,
        updated_at=access_request.updated_at,
    )


def to_user_public(user: User) -> UserPublic:
    return UserPublic.model_validate(user, from_attributes=True)


def to_muscle_group_public(muscle_group: MuscleGroup) -> MuscleGroupPublic:
    return MuscleGroupPublic.model_validate(muscle_group, from_attributes=True)


def to_exercise_base(exercise: Exercise) -> ExerciseBase:
    return ExerciseBase.model_validate(exercise, from_attributes=True)


def to_exercise_public(exercise: Exercise) -> ExercisePublic:
    sorted_muscle_groups = sorted(
        exercise.muscle_groups,
        key=lambda emg: emg.muscle_group.name,
    )
    return ExercisePublic(
        id=exercise.id,
        user_id=exercise.user_id,
        name=exercise.name,
        description=exercise.description,
        created_at=exercise.created_at,
        updated_at=exercise.updated_at,
        muscle_groups=[
            to_muscle_group_public(emg.muscle_group) for emg in sorted_muscle_groups
        ],
    )


def to_set_public(set_: Set) -> SetPublic:
    return SetPublic.model_validate(set_, from_attributes=True)


def to_workout_exercise_public(
    workout_exercise: WorkoutExercise,
) -> WorkoutExercisePublic:
    return WorkoutExercisePublic(
        id=workout_exercise.id,
        workout_id=workout_exercise.workout_id,
        exercise_id=workout_exercise.exercise_id,
        position=workout_exercise.position,
        notes=workout_exercise.notes,
        created_at=workout_exercise.created_at,
        updated_at=workout_exercise.updated_at,
        exercise=to_exercise_base(workout_exercise.exercise),
        sets=[to_set_public(s) for s in workout_exercise.sets],
    )


def to_workout_base(workout: Workout) -> WorkoutBase:
    return WorkoutBase.model_validate(workout, from_attributes=True)


def to_workout_public(workout: Workout) -> WorkoutPublic:
    return WorkoutPublic(
        id=workout.id,
        user_id=workout.user_id,
        started_at=workout.started_at,
        ended_at=workout.ended_at,
        notes=workout.notes,
        created_at=workout.created_at,
        updated_at=workout.updated_at,
        exercises=[to_workout_exercise_public(we) for we in workout.exercises],
    )
