import { type WorkoutBase } from '@/api/generated'
import { zWorkoutBase } from '@/api/generated/zod.gen'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { useRowLoading } from '@/components/data-table/useRowLoading'
import { useDialog } from '@/components/useDialog'
import {
    getWorkoutRowActions,
    getWorkoutToolbarActions,
    handleDelete,
} from '@/components/workouts/utils'
import { formatDateTime, formatNullableDateTime } from '@/lib/datetime'
import { dash } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'

interface WorkoutsTableProps {
    workouts: WorkoutBase[]
    isLoading: boolean
    onWorkoutDeleted: (workoutId: number) => void
    onReloadWorkouts: () => Promise<void>
}

export function WorkoutsTable({
    workouts,
    isLoading,
    onWorkoutDeleted,
    onReloadWorkouts,
}: WorkoutsTableProps) {
    const { isRowLoading, setRowLoading } = useRowLoading<number>()
    const deleteDialog = useDialog(async (workoutId: number) => {
        await handleDelete(
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

    const columns: ColumnDef<WorkoutBase>[] = [
        {
            id: 'actions',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Actions"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => (
                <DataTableInlineRowActions
                    row={row}
                    config={rowActionsConfig}
                />
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'started_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Started At" />
            ),
            cell: ({ row }) => formatDateTime(row.original.started_at),
            enableHiding: false,
        },
        {
            accessorKey: 'ended_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Ended At" />
            ),
            cell: ({ row }) => formatNullableDateTime(row.original.ended_at),
            enableHiding: false,
        },
        {
            accessorKey: 'notes',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Notes" />
            ),
            cell: ({ row }) =>
                row.original.notes ? (
                    <DataTableTruncatedCell
                        value={row.original.notes}
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
            cell: ({ row }) => formatDateTime(row.original.created_at),
            enableHiding: true,
        },
        {
            accessorKey: 'updated_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated At" />
            ),
            cell: ({ row }) => formatDateTime(row.original.updated_at),
            enableHiding: true,
        },
    ]

    const toolbarConfig: DataTableToolbarConfig = {
        search: {
            columnId: 'notes',
            placeholder: 'Filter by notes...',
        },
        actions: getWorkoutToolbarActions(),
        showViewOptions: true,
    }

    return (
        <>
            <DataTable
                data={workouts}
                columns={columns}
                toolbarConfig={toolbarConfig}
                pageSize={10}
                isLoading={isLoading}
            />
            {/* TODO create dialog */}
            <ConfirmDialog
                open={deleteDialog.state.isOpen}
                isConfirming={deleteDialog.state.isConfirming}
                title="Delete Workout"
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
                Are you sure you want to delete this workout?
                <div className="mt-2">This action is irreversible.</div>
            </ConfirmDialog>
        </>
    )
}
