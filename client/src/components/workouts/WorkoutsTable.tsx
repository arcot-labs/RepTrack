import { WorkoutService, type WorkoutBase } from '@/api/generated'
import { zWorkoutBase } from '@/api/generated/zod.gen'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/overrides/button'
import { formatDateTime, formatNullableDateTime } from '@/lib/datetime'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { redText } from '@/lib/styles'
import { dash } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpRight, Plus, Trash } from 'lucide-react'
import { useState } from 'react'

interface WorkoutsTableProps {
    workouts: WorkoutBase[]
    isLoading: boolean
    onReloadWorkouts: () => Promise<void>
}

export function WorkoutsTable({
    workouts,
    isLoading,
    onReloadWorkouts,
}: WorkoutsTableProps) {
    const [isLoadingWorkoutIds, setIsLoadingWorkoutIds] = useState<
         
        Set<number>
    >(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean
        workout: WorkoutBase | null
    }>({
        isOpen: false,
        workout: null,
    })

    const openDeleteDialog = (workout: WorkoutBase) => {
        setDeleteDialog({ isOpen: true, workout })
    }

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, workout: null })
    }

    const setWorkoutRowLoading = (workoutId: number, isLoading: boolean) => {
        setIsLoadingWorkoutIds((prev) => {
            const next = new Set(prev)
            if (isLoading) next.add(workoutId)
            else next.delete(workoutId)
            return next
        })
    }

    const handleDeleteWorkout = async () => {
        const workout = deleteDialog.workout
        if (!workout) return

        setIsDeleting(true)
        setWorkoutRowLoading(workout.id, true)
        try {
            const { error } = await WorkoutService.deleteWorkout({
                path: { workout_id: workout.id },
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
                closeDeleteDialog()
                return
            }
            notify.success('Workout deleted')
            await onReloadWorkouts()
            closeDeleteDialog()
        } finally {
            setWorkoutRowLoading(workout.id, false)
            setIsDeleting(false)
        }
    }

    const rowActionsConfig: DataTableRowActionsConfig<WorkoutBase> = {
        schema: zWorkoutBase,
        menuItems: (row) => {
            const isRowLoading = isLoadingWorkoutIds.has(row.id)
            return [
                {
                    type: 'action',
                    icon: ArrowUpRight,
                    onSelect: () => {
                        notify.warning('Not yet implemented')
                        // TODO open details page
                        // void navigate(`/workouts/${String(row.id)}`)
                    },
                    disabled: isRowLoading,
                },
                {
                    type: 'action',
                    className: redText,
                    icon: Trash,
                    onSelect: () => {
                        openDeleteDialog(row)
                    },
                },
            ]
        },
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
        actions: [
            {
                label: 'Add Workout',
                icon: Plus,
                onClick: () => {
                    // TODO open create dialog
                    notify.warning('Not yet implemented')
                },
            },
        ],
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
            <Dialog
                open={deleteDialog.isOpen}
                onOpenChange={(isOpen) => {
                    if (!isDeleting)
                        setDeleteDialog((prev) => ({ ...prev, isOpen }))
                }}
            >
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Delete Workout</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                        Are you sure you want to delete this workout?
                        <div className="mt-2">This action is irreversible.</div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={closeDeleteDialog}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleDeleteWorkout()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
