import { type WorkoutBase } from '@/api/generated'
import { zWorkoutBase } from '@/api/generated/zod.gen'
import { useDialog } from '@/components/useDialog'
import {
    getWorkoutRowActions,
    getWorkoutToolbarActions,
    handleDeleteWorkout,
} from '@/components/workouts/utils'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
} from '@/models/data-table'

interface UseWorkoutsTableControllerProps {
    isRowLoading: (id: number) => boolean
    onReloadWorkouts: () => Promise<void>
    onWorkoutDeleted: (workoutId: number) => void
    setRowLoading: (id: number, isLoading: boolean) => void
}

interface WorkoutsDeleteDialogController {
    state: {
        isOpen: boolean
        isConfirming: boolean
        args: [number] | null
    }
    open: (workoutId: number) => void
    close: () => void
    confirm: () => Promise<void>
}

interface UseWorkoutsTableControllerResult {
    deleteDialog: WorkoutsDeleteDialogController
    rowActionsConfig: DataTableRowActionsConfig<WorkoutBase>
    toolbarConfig: DataTableToolbarConfig
}

export function useWorkoutsTableController({
    isRowLoading,
    onReloadWorkouts,
    onWorkoutDeleted,
    setRowLoading,
}: UseWorkoutsTableControllerProps): UseWorkoutsTableControllerResult {
    const deleteDialog = useDialog(async (workoutId: number) => {
        await handleDeleteWorkout(
            workoutId,
            onWorkoutDeleted,
            onReloadWorkouts,
            setRowLoading
        )
    })

    const rowActionsConfig: DataTableRowActionsConfig<WorkoutBase> = {
        schema: zWorkoutBase,
        menuItems: (row) =>
            getWorkoutRowActions(
                row.id,
                isRowLoading(row.id),
                deleteDialog.open
            ),
    }

    const toolbarConfig: DataTableToolbarConfig = {
        search: {
            columnId: 'notes',
            placeholder: 'Filter by notes...',
        },
        actions: getWorkoutToolbarActions(),
        showViewOptions: true,
    }

    return {
        deleteDialog,
        rowActionsConfig,
        toolbarConfig,
    }
}
