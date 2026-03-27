import { DataTablePagination } from '@/components/data-table/DataTablePagination'
import { DataTableSkeleton } from '@/components/data-table/DataTableSkeleton'
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import type { DataTableToolbarConfig } from '@/models/data-table'
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
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
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    pageSize?: number
    isLoading: boolean
    toolbarConfig?: DataTableToolbarConfig
    initialColumnVisibility?: VisibilityState
    firstColumnPaddingExcludeIds?: string[]
    lastColumnPaddingExcludeIds?: string[]
}

export function DataTable<TData, TValue>({
    data,
    columns,
    pageSize = 10,
    isLoading,
    toolbarConfig,
    initialColumnVisibility,
    firstColumnPaddingExcludeIds = ['actions'],
    lastColumnPaddingExcludeIds = ['actions'],
}: DataTableProps<TData, TValue>) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState(
        initialColumnVisibility ?? {}
    )
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])

    const shouldPadFirstColumn = (idx: number, columnId: string) =>
        idx === 0 && !firstColumnPaddingExcludeIds.includes(columnId)

    const shouldPadLastColumn = (
        idx: number,
        lastIdx: number,
        columnId: string
    ) => idx === lastIdx && !lastColumnPaddingExcludeIds.includes(columnId)

    const getEdgePaddingClassName = (
        idx: number,
        lastIdx: number,
        columnId: string,
        baseClassName?: string
    ) => {
        const paddingClasses = []
        if (shouldPadFirstColumn(idx, columnId)) {
            paddingClasses.push('pl-4')
        }
        if (shouldPadLastColumn(idx, lastIdx, columnId)) {
            paddingClasses.push('pr-4')
        }
        if (paddingClasses.length === 0) return baseClassName

        return baseClassName
            ? `${baseClassName} ${paddingClasses.join(' ')}`
            : paddingClasses.join(' ')
    }

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
        <div className="flex flex-col gap-2 md:gap-3">
            {toolbarConfig && (
                <DataTableToolbar table={table} config={toolbarConfig} />
            )}
            {isLoading ? (
                <DataTableSkeleton columnCount={columns.length} />
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(
                                        (header, headerIdx) => {
                                            return (
                                                <TableHead
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className={getEdgePaddingClassName(
                                                        headerIdx,
                                                        headerGroup.headers
                                                            .length - 1,
                                                        header.column.id
                                                    )}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column
                                                                  .columnDef
                                                                  .header,
                                                              header.getContext()
                                                          )}
                                                </TableHead>
                                            )
                                        }
                                    )}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row
                                            .getVisibleCells()
                                            .map((cell, cellIdx, cells) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className={getEdgePaddingClassName(
                                                        cellIdx,
                                                        cells.length - 1,
                                                        cell.column.id,
                                                        'h-10'
                                                    )}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
            <DataTablePagination table={table} />
        </div>
    )
}
