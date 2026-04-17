import {
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import {
    getExerciseRowActions,
    handleDelete,
} from '@/components/exercises/utils'
import { useDialog } from '@/components/useDialog'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import { capitalizeWords } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
} from '@/models/data-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

function getTypeFilterOptions(): FilterOption[] {
    return [
        { label: 'System', value: 'system' },
        { label: 'Custom', value: 'custom' },
    ]
}

type ExerciseFormDialogMode = 'create' | 'edit' | 'view'

interface ExerciseFormDialogState {
    isOpen: boolean
    mode: ExerciseFormDialogMode
    exercise: ExercisePublic | null
}

interface UseExercisesTableControllerProps {
    exercises: ExercisePublic[]
    muscleGroups: MuscleGroupPublic[]
    isRowLoading: (id: number) => boolean
    onExerciseDeleted: (exerciseId: number) => void
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
    setRowLoading: (id: number, isLoading: boolean) => void
}

interface ExercisesDeleteDialogController {
    state: {
        isOpen: boolean
        isConfirming: boolean
        args: [ExercisePublic] | null
    }
    open: (exercise: ExercisePublic) => void
    close: () => void
    confirm: () => Promise<void>
}

interface UseExercisesTableControllerResult {
    deleteDialog: ExercisesDeleteDialogController
    displayedExercises: ExercisePublic[]
    formDialog: ExerciseFormDialogState
    onExerciseFormOpenChange: (isOpen: boolean) => void
    onExerciseFormSuccess: () => Promise<void>
    rowActionsConfig: DataTableRowActionsConfig<ExercisePublic>
    toolbarConfig: DataTableToolbarConfig
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
}

export function useExercisesTableController({
    exercises,
    muscleGroups,
    isRowLoading,
    onExerciseDeleted,
    onReloadExercises,
    onReloadMuscleGroups,
    setRowLoading,
}: UseExercisesTableControllerProps): UseExercisesTableControllerResult {
    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        refreshSearchResults,
        displayedItems: displayedExercises,
    } = useRemoteSearch({
        items: exercises,
        fallbackMessage: 'Failed to search exercises',
        search: (query, limit) =>
            SearchService.searchExercises({
                body: {
                    query,
                    limit,
                },
            }),
        getItemId: (exercise) => exercise.id,
        getResultId: (searchResult) => searchResult.id,
    })

    const [formDialog, setFormDialog] = useState<ExerciseFormDialogState>({
        isOpen: false,
        mode: 'create',
        exercise: null,
    })

    const deleteDialog = useDialog(async (exercise: ExercisePublic) => {
        await handleDelete(
            exercise.id,
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading
        )
    })

    const openFormDialog = (
        mode: ExerciseFormDialogMode,
        exercise: ExercisePublic | null = null
    ) => {
        setFormDialog({
            isOpen: true,
            mode,
            exercise,
        })
    }

    const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
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
                deleteDialog.open
            ),
    }

    const toolbarConfig: DataTableToolbarConfig = {
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
                onClick: () => {
                    openFormDialog('create')
                },
            },
        ],
        showViewOptions: true,
    }

    return {
        deleteDialog,
        displayedExercises,
        formDialog,
        onExerciseFormOpenChange: (isOpen: boolean) => {
            setFormDialog((prev) => ({ ...prev, isOpen }))
        },
        onExerciseFormSuccess: async () => {
            await onReloadExercises()
            refreshSearchResults()
        },
        rowActionsConfig,
        toolbarConfig,
        onReloadExercises,
        onReloadMuscleGroups,
    }
}
