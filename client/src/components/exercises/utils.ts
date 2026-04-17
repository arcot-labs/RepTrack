import { ExerciseService, type ExercisePublic } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { blueText, redText } from '@/lib/styles'
import type { MenuItemConfig } from '@/models/data-table'
import { Copy, Eye, Pencil, Trash } from 'lucide-react'

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

export const getExerciseRowActions = (
    exercise: ExercisePublic,
    isRowLoading: boolean,
    openViewDialog: (exercise: ExercisePublic) => void,
    openCopyDialog: (exercise: ExercisePublic) => void,
    openEditDialog: (exercise: ExercisePublic) => void,
    openDeleteDialog: (exercise: ExercisePublic) => void
): MenuItemConfig[] => {
    if (exercise.user_id === null)
        return [
            {
                type: 'action',
                icon: Eye,
                onSelect: () => {
                    openViewDialog(exercise)
                },
            },
            {
                type: 'action',
                className: blueText,
                icon: Copy,
                onSelect: () => {
                    openCopyDialog(exercise)
                },
            },
        ]
    return [
        {
            type: 'action',
            icon: Pencil,
            onSelect: () => {
                openEditDialog(exercise)
            },
            disabled: isRowLoading,
        },
        {
            type: 'action',
            className: blueText,
            icon: Copy,
            onSelect: () => {
                openCopyDialog(exercise)
            },
        },
        {
            type: 'action',
            className: redText,
            icon: Trash,
            onSelect: () => {
                openDeleteDialog(exercise)
            },
        },
    ]
}
