import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/data-table/DataTable'
import { useRowLoading } from '@/components/data-table/useRowLoading'
import { ExerciseFormDialog } from '@/components/exercises/ExerciseFormDialog'
import { getExerciseColumns } from '@/components/exercises/ExercisesTableColumns'
import { useExercisesTableController } from '@/components/exercises/useExercisesTableController'

interface ExercisesTableProps {
    exercises: ExercisePublic[]
    muscleGroups: MuscleGroupPublic[]
    isLoading: boolean
    onExerciseDeleted: (exerciseId: number) => void
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
}

export function ExercisesTable({
    exercises,
    muscleGroups,
    isLoading,
    onExerciseDeleted,
    onReloadExercises,
    onReloadMuscleGroups,
}: ExercisesTableProps) {
    const { isRowLoading, setRowLoading } = useRowLoading<number>()
    const {
        deleteDialog,
        displayedExercises,
        formDialog,
        onExerciseFormOpenChange,
        onExerciseFormSuccess,
        onReloadExercises: reloadExercises,
        onReloadMuscleGroups: reloadMuscleGroups,
        rowActionsConfig,
        toolbarConfig,
    } = useExercisesTableController({
        exercises,
        muscleGroups,
        isRowLoading,
        onExerciseDeleted,
        onReloadExercises,
        onReloadMuscleGroups,
        setRowLoading,
    })

    return (
        <>
            <DataTable
                data={displayedExercises}
                columns={getExerciseColumns(rowActionsConfig)}
                initialColumnVisibility={{ type: false }}
                toolbarConfig={toolbarConfig}
                pageSize={10}
                isLoading={isLoading}
            />
            <ExerciseFormDialog
                open={formDialog.isOpen}
                mode={formDialog.mode}
                exercise={formDialog.exercise}
                muscleGroups={muscleGroups}
                isRowLoading={
                    formDialog.exercise
                        ? isRowLoading(formDialog.exercise.id)
                        : false
                }
                onOpenChange={onExerciseFormOpenChange}
                onSuccess={onExerciseFormSuccess}
                onReloadExercises={reloadExercises}
                onReloadMuscleGroups={reloadMuscleGroups}
                onRowLoadingChange={setRowLoading}
            />
            <ConfirmDialog
                open={deleteDialog.state.isOpen}
                isConfirming={deleteDialog.state.isConfirming}
                title="Delete Exercise"
                onOpenChange={(isOpen) => {
                    if (isOpen || deleteDialog.state.isConfirming) return
                    deleteDialog.close()
                }}
                onCancel={deleteDialog.close}
                onConfirm={() => void deleteDialog.confirm()}
                confirmLabel={
                    deleteDialog.state.isConfirming ? 'Deleting...' : 'Delete'
                }
            >
                Are you sure you want to delete{' '}
                <span className="font-semibold">
                    {deleteDialog.state.args?.[0].name}
                </span>
                ?<div className="mt-2">This action is irreversible.</div>
            </ConfirmDialog>
        </>
    )
}
