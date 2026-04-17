import {
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { useRowLoading } from '@/components/data-table/useRowLoading'
import { ExerciseFormDialog } from '@/components/exercises/ExerciseFormDialog'
import {
    getExerciseRowActions,
    handleDelete,
} from '@/components/exercises/utils'
import { useDialog } from '@/components/useDialog'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import { formatNullableDateTime } from '@/lib/datetime'
import { capitalizeWords, dash } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useState } from 'react'

function getTypeFilterOptions(): FilterOption[] {
    return [
        { label: 'System', value: 'system' },
        { label: 'Custom', value: 'custom' },
    ]
}

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

    const [formDialog, setFormDialog] = useState<{
        isOpen: boolean
        mode: 'create' | 'edit' | 'view'
        exercise: ExercisePublic | null
    }>({
        isOpen: false,
        mode: 'create',
        exercise: null,
    })

    const { isRowLoading, setRowLoading } = useRowLoading<number>()
    const deleteDialog = useDialog(async (exercise: ExercisePublic) => {
        await handleDelete(
            exercise.id,
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading
        )
    })

    const openCreateDialog = () => {
        setFormDialog({
            isOpen: true,
            mode: 'create',
            exercise: null,
        })
    }

    const openCopyDialog = (exercise: ExercisePublic) => {
        setFormDialog({ isOpen: true, mode: 'create', exercise })
    }

    const openEditDialog = (exercise: ExercisePublic) => {
        setFormDialog({ isOpen: true, mode: 'edit', exercise })
    }

    const openViewDialog = (exercise: ExercisePublic) => {
        setFormDialog({ isOpen: true, mode: 'view', exercise })
    }

    const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
        schema: zExercisePublic,
        menuItems: (row) =>
            getExerciseRowActions(
                row,
                isRowLoading(row.id),
                openViewDialog,
                openCopyDialog,
                openEditDialog,
                deleteDialog.open
            ),
    }

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
                        {capitalizeWords(row.original.name)}
                    </span>
                    <span className="hidden md:inline">
                        <DataTableTruncatedCell
                            value={capitalizeWords(row.original.name)}
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
                    openCreateDialog()
                },
            },
        ],
        showViewOptions: true,
    }

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
                onOpenChange={(isOpen) => {
                    setFormDialog((prev) => ({ ...prev, isOpen }))
                }}
                onSuccess={async () => {
                    await onReloadExercises()
                    refreshSearchResults()
                }}
                onReloadExercises={onReloadExercises}
                onReloadMuscleGroups={onReloadMuscleGroups}
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
