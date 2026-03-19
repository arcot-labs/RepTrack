from app.models.database.workout_exercise import WorkoutExercise
from app.models.schemas.workout_exercise import WorkoutExercisePublic
from app.services.exercise import to_exercise_base
from app.services.set import to_set_public


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
