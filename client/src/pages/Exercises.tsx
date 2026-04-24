import { ExercisesTable } from '@/components/exercises/ExercisesTable'
import { useExercises } from '@/components/exercises/useExercises'
import { useMuscleGroups } from '@/components/muscle-groups/useMuscleGroups'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'

export function Exercises() {
    const {
        exercises,
        isLoading: isLoadingExercises,
        reload: loadExercises,
        remove: removeExercise,
    } = useExercises()

    const {
        muscleGroups,
        isLoading: isLoadingMuscleGroups,
        reload: loadMuscleGroups,
    } = useMuscleGroups()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Exercises</CardTitle>
            </CardHeader>
            <CardContent>
                <ExercisesTable
                    exercises={exercises}
                    muscleGroups={muscleGroups}
                    isLoading={isLoadingExercises || isLoadingMuscleGroups}
                    onExerciseDeleted={removeExercise}
                    onReloadExercises={loadExercises}
                    onReloadMuscleGroups={loadMuscleGroups}
                />
            </CardContent>
        </Card>
    )
}
