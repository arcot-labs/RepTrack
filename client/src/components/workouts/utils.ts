import { WorkoutService } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { redText } from '@/lib/styles'
import type {
    DataTableToolbarAction,
    MenuItemConfig,
} from '@/models/data-table'
import { ArrowUpRight, Plus, Trash } from 'lucide-react'

export const handleDeleteWorkout = async (
    workoutId: number,
    onWorkoutDeleted: (workoutId: number) => void,
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
        onWorkoutDeleted(workoutId)
    } finally {
        setRowLoading(workoutId, false)
    }
}

export const getWorkoutRowActions = (
    workoutId: number,
    isRowLoading: boolean,
    openDeleteDialog: (workoutId: number) => void
): MenuItemConfig[] => {
    return [
        {
            type: 'action',
            icon: ArrowUpRight,
            onSelect: () => {
                // TODO open details page
                notify.warning('Not yet implemented')
                // void navigate(`/workouts/${String(workoutId)}`)
            },
            disabled: isRowLoading,
        },
        {
            type: 'action',
            className: redText,
            icon: Trash,
            onSelect: () => {
                openDeleteDialog(workoutId)
            },
            disabled: isRowLoading,
        },
    ]
}

export const getWorkoutToolbarActions = (): DataTableToolbarAction[] => [
    {
        label: 'Add Workout',
        icon: Plus,
        onClick: () => {
            // TODO open create dialog
            notify.warning('Not yet implemented')
        },
    },
]
