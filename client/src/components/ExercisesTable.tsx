import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { createSelectColumn } from '@/components/data-table/DataTableSelectColumn'
import { blueText, redText } from '@/lib/styles'
import { capitalizeWords } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react'
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
    onReloadExercises: () => Promise<void>
}

export function ExercisesTable({
    exercises,
    // muscleGroups,
    isLoading,
    // onReloadExercises,
}: ExercisesTableProps) {
    const [loadingExerciseIds] = useState<Set<number>>(new Set())

    const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
        schema: zExercisePublic,
        menuItems: (row) => {
            if (row.user_id === null) return []

            const isRowLoading = loadingExerciseIds.has(row.id)
            return [
                {
                    type: 'action',
                    label: 'Edit',
                    icon: Pencil,
                    onSelect: () => {
                        // TODO implement
                        // eslint-disable-next-line no-console
                        console.log('Edit', row)
                    },
                    disabled: isRowLoading,
                },
                {
                    type: 'action',
                    className: redText,
                    label: 'Delete',
                    icon: Trash2,
                    onSelect: () => {
                        // TODO implement
                        // eslint-disable-next-line no-console
                        console.log('Delete', row)
                    },
                },
            ]
        },
    }

    const columns: ColumnDef<ExercisePublic>[] = [
        createSelectColumn<ExercisePublic>(),
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    {row.original.user_id === null && (
                        <Lock className={`size-3 shrink-0 ${blueText}`} />
                    )}
                    {row.original.name}
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'description',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) => row.original.description ?? '—',
            enableHiding: true,
        },
        {
            id: 'muscle_groups',
            meta: { viewLabel: 'Muscle Groups' },
            accessorFn: (row) =>
                row.muscle_groups
                    .map((group) => capitalizeWords(group.name))
                    .join(', '),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Muscle Groups" />
            ),
            cell: ({ row }) => {
                const names = row.original.muscle_groups.map((group) =>
                    capitalizeWords(group.name)
                )
                return names.length ? names.join(', ') : '—'
            },
            enableHiding: true,
        },
        {
            id: 'type',
            meta: { filterOnly: true },
            accessorFn: (row) => (row.user_id === null ? 'system' : 'custom'),
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
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
                    <div className="text-center">—</div>
                )
            },
            enableHiding: false,
        },
        {
            accessorKey: 'updated_at',
            meta: { viewLabel: 'Updated At' },
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Updated At"
                    className="justify-center"
                />
            ),
            cell: ({ row }) =>
                row.original.user_id !== null ? (
                    <div className="text-center">
                        {new Date(row.original.updated_at).toLocaleString()}
                    </div>
                ) : (
                    <div className="text-center">—</div>
                ),
            enableHiding: true,
        },
    ]

    const toolbarConfig: DataTableToolbarConfig = {
        search: {
            columnId: 'name',
            placeholder: 'Filter by name...',
        },
        filters: [
            {
                columnId: 'type',
                title: 'Type',
                options: getTypeFilterOptions(),
            },
        ],
        actions: [
            {
                label: 'Add Exercise',
                icon: Plus,
                onClick: () => {
                    // TODO implement
                    // eslint-disable-next-line no-console
                    console.log('Add Exercise')
                },
            },
        ],
        showViewOptions: true,
    }

    return (
        <>
            <DataTable
                data={exercises}
                columns={columns}
                pageSize={10}
                isLoading={isLoading}
                toolbarConfig={toolbarConfig}
                initialColumnVisibility={{ type: false }}
            />
        </>
    )
}
