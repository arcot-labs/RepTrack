import {
    ExerciseService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { blueText, redText } from '@/lib/styles'
import { capitalizeWords } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
    MenuItemConfig,
} from '@/models/data-table'
import type { ExerciseFormDialogMode } from '@/models/exercises-table'
import { Copy, Eye, Pencil, Plus, Trash } from 'lucide-react'

export const formatExerciseName = (exercise: ExercisePublic) => {
    if (exercise.user_id !== null) return exercise.name
    return capitalizeWords(exercise.name)
}

export const handleDeleteExercise = async (
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

interface ExerciseRowActionsConfigArgs {
    isRowLoading: (id: number) => boolean
    openFormDialog: (
        mode: ExerciseFormDialogMode,
        exercise?: ExercisePublic | null
    ) => void
    openDeleteDialog: (exercise: ExercisePublic) => void
}

export const getExerciseRowActionsConfig = ({
    isRowLoading,
    openFormDialog,
    openDeleteDialog,
}: ExerciseRowActionsConfigArgs): DataTableRowActionsConfig<ExercisePublic> => ({
    schema: zExercisePublic,
    menuItems: (row) =>
        getExerciseRowActions(
            row,
            isRowLoading(row.id),
            (exercise) => {
                openFormDialog('view', exercise)
            },
            (exercise) => {
                openFormDialog('create', exercise)
            },
            (exercise) => {
                openFormDialog('edit', exercise)
            },
            openDeleteDialog
        ),
})

function getTypeFilterOptions(): FilterOption[] {
    return [
        { label: 'System', value: 'system' },
        { label: 'Custom', value: 'custom' },
    ]
}

interface ExerciseToolbarConfigArgs {
    searchQuery: string
    setSearchQuery: (value: string) => void
    isSearching: boolean
    muscleGroups: MuscleGroupPublic[]
    onCreateExercise: () => void
}

export const getExerciseToolbarConfig = ({
    searchQuery,
    setSearchQuery,
    isSearching,
    muscleGroups,
    onCreateExercise,
}: ExerciseToolbarConfigArgs): DataTableToolbarConfig => ({
    search: {
        placeholder: 'Search exercises...',
        value: searchQuery,
        onChange: setSearchQuery,
        isLoading: isSearching,
    },
    filters: [
        {
            columnId: 'type',
            title: 'Type',
            options: getTypeFilterOptions(),
        },
        {
            columnId: 'muscle_groups',
            title: 'Muscle Groups',
            options: muscleGroups.map((group) => ({
                label: capitalizeWords(group.name),
                value: String(group.id),
            })),
        },
    ],
    actions: [
        {
            label: 'Add Exercise',
            icon: Plus,
            onClick: onCreateExercise,
        },
    ],
    showViewOptions: true,
})
