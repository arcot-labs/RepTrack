import {
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import {
    getExerciseRowActionsConfig,
    getExerciseToolbarConfig,
    handleDeleteExercise,
} from '@/components/exercises/utils'
import { useDialog } from '@/components/useDialog'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
} from '@/models/data-table'
import type {
    ExerciseFormDialogMode,
    ExerciseFormDialogState,
} from '@/models/exercises-table'
import { useState } from 'react'

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
        await handleDeleteExercise(
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

    const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> =
        getExerciseRowActionsConfig({
            isRowLoading,
            openFormDialog,
            openDeleteDialog: deleteDialog.open,
        })

    const toolbarConfig: DataTableToolbarConfig = getExerciseToolbarConfig({
        searchQuery,
        setSearchQuery,
        isSearching,
        muscleGroups,
        onCreateExercise: () => {
            openFormDialog('create')
        },
    })

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
