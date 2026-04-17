import { ExerciseService } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'

export const handleDelete = async (
    exerciseId: number,
    onExerciseDeleted: (exerciseId: number) => void,
    refreshSearchResults: () => void,
    onReloadExercises: () => Promise<void>,
    setRowLoading: (exerciseId: number, isLoading: boolean) => void
) => {
    setRowLoading(exerciseId, true)
    try {
        const { error } = await ExerciseService.deleteExercise({
            path: { exercise_id: exerciseId },
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    exercise_not_found: async () => {
                        notify.error('Exercise not found. Reloading data')
                        await onReloadExercises()
                    },
                },
                fallbackMessage: 'Failed to delete exercise',
            })
            return
        }
        notify.success('Exercise deleted')
        onExerciseDeleted(exerciseId)
        refreshSearchResults()
    } finally {
        setRowLoading(exerciseId, false)
    }
}
