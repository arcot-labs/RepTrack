import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { useRowLoading } from '@/components/data-table/useRowLoading'
import { ExerciseFormDialog } from '@/components/exercises/ExerciseFormDialog'
import { useExercisesTableController } from '@/components/exercises/useExercisesTableController'
import { formatExerciseName } from '@/components/exercises/utils'
import { formatNullableDateTime } from '@/lib/datetime'
import { capitalizeWords, dash } from '@/lib/text'
import type { ColumnDef } from '@tanstack/react-table'

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

    const columns: ColumnDef<ExercisePublic>[] = [
        {
            id: 'actions',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Actions"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => {
                const menuItems = rowActionsConfig.menuItems(row.original)
                return menuItems.length > 0 ? (
                    <DataTableInlineRowActions
                        row={row}
                        config={rowActionsConfig}
                    />
                ) : (
                    <div className="text-center">{dash}</div>
                )
            },
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <>
                    <span className="inline md:hidden">
                        {formatExerciseName(row.original)}
                    </span>
                    <span className="hidden md:inline">
                        <DataTableTruncatedCell
                            value={formatExerciseName(row.original)}
                            className="max-w-50 min-w-25"
                        />
                    </span>
                </>
            ),
            enableHiding: false,
        },
        {
            id: 'muscle_groups',
            meta: { viewLabel: 'Muscle Groups' },
            accessorFn: (row) =>
                // used for sorting
                row.muscle_groups.map((group) => group.name).join(', '),
            getUniqueValues: (row) =>
                row.muscle_groups.map((group) => String(group.id)),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Muscle Groups" />
            ),
            cell: ({ row }) => {
                const names = row.original.muscle_groups.map((group) =>
                    capitalizeWords(group.name)
                )
                return names.length ? (
                    <>
                        <span className="inline md:hidden">
                            {names.join(', ')}
                        </span>
                        <span className="hidden md:inline">
                            <DataTableTruncatedCell
                                value={names.join(', ')}
                                className="max-w-100 min-w-25"
                            />
                        </span>
                    </>
                ) : (
                    dash
                )
            },
            filterFn: (row, _id, filterValues: string[]) => {
                if (!filterValues.length) return true
                const rowGroupIds = new Set(
                    row.original.muscle_groups.map((group) => String(group.id))
                )
                return filterValues.some((groupId) => rowGroupIds.has(groupId))
            },
            enableHiding: true,
        },
        {
            accessorKey: 'description',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) =>
                row.original.description ? (
                    <DataTableTruncatedCell
                        value={row.original.description}
                        className="max-w-100 min-w-25 lg:max-w-150"
                    />
                ) : (
                    dash
                ),
            enableHiding: true,
        },
        {
            accessorKey: 'created_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created At" />
            ),
            cell: ({ row }) =>
                row.original.user_id !== null
                    ? formatNullableDateTime(row.original.created_at)
                    : dash,
            enableHiding: true,
        },
        {
            accessorKey: 'updated_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated At" />
            ),
            cell: ({ row }) =>
                row.original.user_id !== null
                    ? formatNullableDateTime(row.original.updated_at)
                    : dash,
            enableHiding: true,
        },
        // virtual column for filtering
        {
            id: 'type',
            meta: { filterOnly: true },
            accessorFn: (row) => (row.user_id === null ? 'system' : 'custom'),
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
    ]

    return (
        <>
            <DataTable
                data={displayedExercises}
                columns={columns}
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
