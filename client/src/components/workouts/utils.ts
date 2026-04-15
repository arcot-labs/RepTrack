import { WorkoutService, type WorkoutBase } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { redText } from '@/lib/styles'
import type {
    DataTableToolbarConfig,
    MenuItemConfig,
} from '@/models/data-table'
import { ArrowUpRight, Plus, Trash } from 'lucide-react'

export const handleDelete = async (
    workoutId: number,
    onReloadWorkouts: () => Promise<void>,
    setRowLoading: (workoutId: number, isLoading: boolean) => void
) => {
    setRowLoading(workoutId, true)
    try {
        const { error } = await WorkoutService.deleteWorkout({
            path: { workout_id: workoutId },
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    workout_not_found: async () => {
                        notify.error('Workout not found. Reloading data')
                        await onReloadWorkouts()
                    },
                },
                fallbackMessage: 'Failed to delete workout',
            })
            return
        }
        notify.success('Workout deleted')
        await onReloadWorkouts()
    } finally {
        setRowLoading(workoutId, false)
    }
}

export const getWorkoutRowActions = (
    workout: WorkoutBase,
    isRowLoading: boolean,
    openDeleteDialog: (workout: WorkoutBase) => void
): MenuItemConfig[] => {
    return [
        {
            type: 'action',
            icon: ArrowUpRight,
            onSelect: () => {
                // TODO open details page
                notify.warning('Not yet implemented')
                // void navigate(`/workouts/${String(workout.id)}`)
            },
            disabled: isRowLoading,
        },
        {
            type: 'action',
            className: redText,
            icon: Trash,
            onSelect: () => {
                openDeleteDialog(workout)
            },
            disabled: isRowLoading,
        },
    ]
}

export const getWorkoutToolbarActions =
    (): DataTableToolbarConfig['actions'] => [
        {
            label: 'Add Workout',
            icon: Plus,
            onClick: () => {
                // TODO open create dialog
                notify.warning('Not yet implemented')
            },
        },
    ]
