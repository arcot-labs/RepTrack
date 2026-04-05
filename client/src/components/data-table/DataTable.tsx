import {
    DataTableContent,
    type EdgePaddingConfig,
} from '@/components/data-table/DataTableContent'
import { DataTablePagination } from '@/components/data-table/DataTablePagination'
import { DataTableSkeleton } from '@/components/data-table/DataTableSkeleton'
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar'
import { type DataTableColumnMeta } from '@/components/data-table/DataTableViewOptions'
import type { DataTableToolbarConfig } from '@/models/data-table'
import {
    type ColumnDef,
    type ColumnFiltersState,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'

interface DataTableProps<TData, TValue> {
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    initialColumnVisibility?: VisibilityState
    edgePaddingConfig?: EdgePaddingConfig
    toolbarConfig?: DataTableToolbarConfig
    pageSize?: number
    isLoading: boolean
}

const MEDIUM_BREAKPOINT_QUERY = '(min-width: 768px)'

function getResponsiveHiddenColumnIds<TData, TValue>(
    columns: ColumnDef<TData, TValue>[]
): string[] {
    const hiddenColumnIds = new Set<string>()

    for (const col of columns) {
        const meta = col.meta as DataTableColumnMeta | undefined
        if (!meta?.hideOnBelowMd || col.enableHiding === false) continue

        if (typeof col.id === 'string') {
            hiddenColumnIds.add(col.id)
            continue
        }
        const accessorKey = (col as { accessorKey?: string }).accessorKey
        if (typeof accessorKey === 'string') {
            // replace path separator
            hiddenColumnIds.add(accessorKey.replaceAll('.', '_'))
        }
    }

    return [...hiddenColumnIds]
}

function getInitialColumnVisibilityState<TData, TValue>(
    columns: ColumnDef<TData, TValue>[],
    initialColumnVisibility?: VisibilityState,
    toolbarConfig?: DataTableToolbarConfig
): VisibilityState {
    const baseColumnVisibility = initialColumnVisibility ?? {}

    // prevent responsive hiding if view options disabled
    if (!(toolbarConfig?.showViewOptions ?? true)) return baseColumnVisibility

    if (window.matchMedia(MEDIUM_BREAKPOINT_QUERY).matches)
        return baseColumnVisibility

    const responsiveHiddenColumnIds = getResponsiveHiddenColumnIds(columns)
    if (!responsiveHiddenColumnIds.length) return baseColumnVisibility

    const responsiveVisibilityState = Object.fromEntries(
        responsiveHiddenColumnIds.map((columnId) => [columnId, false])
    ) as VisibilityState

    // explicit initial visibility takes precedence over responsive defaults
    return {
        ...responsiveVisibilityState,
        ...baseColumnVisibility,
    }
}

export function DataTable<TData, TValue>({
    data,
    columns,
    initialColumnVisibility,
    edgePaddingConfig = {
        firstColumnExcludeIds: ['actions'],
        lastColumnExcludeIds: ['actions'],
    },
    toolbarConfig,
    pageSize = 10,
    isLoading,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        () =>
            getInitialColumnVisibilityState(
                columns,
                initialColumnVisibility,
                toolbarConfig
            )
    )
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState({})

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize,
            },
        },
        state: {
            columnFilters,
            columnVisibility,
            sorting,
            rowSelection,
        },
    })

    return (
        <div className="flex flex-col gap-2 md:mt-2 md:gap-3">
            {toolbarConfig && (
                <DataTableToolbar table={table} config={toolbarConfig} />
            )}
            {isLoading ? (
                <DataTableSkeleton columnCount={columns.length} />
            ) : (
                <DataTableContent
                    table={table}
                    columnsLength={columns.length}
                    edgePaddingConfig={edgePaddingConfig}
                />
            )}
            <DataTablePagination table={table} />
        </div>
    )
}
