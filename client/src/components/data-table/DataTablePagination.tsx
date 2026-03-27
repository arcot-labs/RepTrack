import { type Table } from '@tanstack/react-table'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/overrides/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
    table: Table<TData>
}

const getDisplayedRowsText = <TData,>(table: Table<TData>) => {
    const pageIndex = table.getState().pagination.pageIndex
    const pageSize = table.getState().pagination.pageSize
    const totalRows = table.getFilteredRowModel().rows.length

    const startRow = pageIndex * pageSize + 1
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

    return `${String(startRow)}-${String(endRow)} of ${String(totalRows)} row(s)`
}

export function DataTablePagination<TData>({
    table,
}: DataTablePaginationProps<TData>) {
    return (
        <div className="flex items-center gap-2 text-xs md:px-4 md:text-sm">
            <div>
                <div className="text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{' '}
                    {table.getPageCount()}
                </div>
                <div className="hidden md:flex">
                    {table
                        .getAllColumns()
                        .find((column) => column.id === 'select') ? (
                        <div className="text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of{' '}
                            {table.getFilteredRowModel().rows.length} row(s)
                            selected
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            {getDisplayedRowsText(table)}
                        </div>
                    )}
                </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-2 md:gap-2">
                    <p className="text-muted-foreground">Page size</p>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value))
                        }}
                    >
                        <SelectTrigger className="h-8! w-17 text-xs md:text-sm">
                            <SelectValue
                                placeholder={
                                    table.getState().pagination.pageSize
                                }
                            />
                        </SelectTrigger>
                        <SelectContent side="top" className="min-w-0">
                            {[5, 10, 25, 50].map((pageSize) => (
                                <SelectItem
                                    key={pageSize}
                                    value={String(pageSize)}
                                    className="text-xs md:text-sm"
                                >
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex">
                    <Button
                        variant="outline"
                        size="icon"
                        className="me-1 hidden size-8 md:flex"
                        onClick={() => {
                            table.setPageIndex(0)
                        }}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="me-1 size-8"
                        onClick={() => {
                            table.previousPage()
                        }}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 md:me-1"
                        onClick={() => {
                            table.nextPage()
                        }}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 md:flex"
                        onClick={() => {
                            table.setPageIndex(table.getPageCount() - 1)
                        }}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight />
                    </Button>
                </div>
            </div>
        </div>
    )
}
