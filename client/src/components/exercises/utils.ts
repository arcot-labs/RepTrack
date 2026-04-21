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

export const getExerciseDialogLabels = (mode: ExerciseFormDialogMode) => ({
    title:
        mode === 'create'
            ? 'Create Exercise'
            : mode === 'view'
              ? 'View Exercise'
              : 'Edit Exercise',
    submitButtonText: mode === 'create' ? 'Create' : 'Save',
    submittingButtonText: mode === 'create' ? 'Creating...' : 'Saving...',
})

export const getSelectedExerciseMuscleGroups = (
    muscleGroups: MuscleGroupPublic[],
    selectedMuscleGroupIds: number[]
) => {
    const selectedIds = new Set(selectedMuscleGroupIds)
    return muscleGroups.filter((group) => selectedIds.has(group.id))
}

export const getExerciseFormValues = (
    mode: ExerciseFormDialogMode,
    exercise: ExercisePublic | null
) => {
    if (mode === 'create') {
        if (!exercise) {
            // create new
            return {
                name: '',
                description: '',
                muscle_group_ids: [],
            }
        }
        // copy existing
        return {
            name: `${exercise.name} - copy`,
            description: exercise.description,
            muscle_group_ids: exercise.muscle_groups.map((mg) => mg.id),
        }
    }
    // edit or view existing
    if (!exercise) throw Error('Exercise data missing for edit/view mode')
    return {
        name: exercise.name,
        description: exercise.description,
        muscle_group_ids: exercise.muscle_groups.map((mg) => mg.id),
    }
}

export const getToggledMuscleGroupIds = (
    selectedMuscleGroupIds: number[],
    muscleGroupId: number,
    checked: boolean
) => {
    const selectedIds = new Set(selectedMuscleGroupIds)
    if (checked) selectedIds.add(muscleGroupId)
    else selectedIds.delete(muscleGroupId)
    return Array.from(selectedIds)
}

const hasDirtyArrayValues = (value: boolean | boolean[] | undefined) =>
    Array.isArray(value) && value.some(Boolean)

type DirtyExerciseFormFields = Record<
    keyof ExerciseUpdateFormValues,
    boolean | boolean[] | undefined
>

interface ExerciseUpdateFormValues {
    name?: string | null
    description?: string | null
    muscle_group_ids?: number[] | null
}

export const getExerciseUpdateBody = (
    dirtyFields: Partial<DirtyExerciseFormFields>,
    formValues: ExerciseUpdateFormValues
) => {
    const body: Partial<ExerciseUpdateFormValues> = {}
    const isMuscleGroupIdsDirty =
        dirtyFields.muscle_group_ids === true ||
        hasDirtyArrayValues(dirtyFields.muscle_group_ids)

    if (dirtyFields.name) body.name = formValues.name ?? ''
    if (dirtyFields.description) body.description = formValues.description ?? ''
    if (isMuscleGroupIdsDirty)
        body.muscle_group_ids = formValues.muscle_group_ids ?? []

    return body
}
