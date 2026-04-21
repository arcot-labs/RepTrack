import type { ExercisePublic } from '@/api/generated'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { formatExerciseName } from '@/components/exercises/utils'
import { formatNullableDateTime } from '@/lib/datetime'
import { capitalizeWords, dash } from '@/lib/text'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'

export const getExerciseColumns = (
    rowActionsConfig: DataTableRowActionsConfig<ExercisePublic>
): ColumnDef<ExercisePublic>[] => [
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
                    <span className="inline md:hidden">{names.join(', ')}</span>
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
    {
        id: 'type',
        meta: { filterOnly: true },
        accessorFn: (row) => (row.user_id === null ? 'system' : 'custom'),
        filterFn: (row, id, filterValues: string[]) =>
            filterValues.includes(row.getValue(id)),
    },
]
