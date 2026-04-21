import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/overrides/button'
import { formatIdentifier } from '@/lib/text'
import type { DataTableColumnMeta } from '@/models/data-table'

function getColumnViewLabel(columnId: string, meta?: unknown): string {
    const resolvedMeta = meta as DataTableColumnMeta | undefined
    return resolvedMeta?.viewLabel ?? formatIdentifier(columnId)
}

export function DataTableViewOptions<TData>({
    table,
}: {
    table: Table<TData>
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    aria-label="View options"
                >
                    <Settings2 />
                    <span className="hidden sm:inline">View</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-37.5">
                {table
                    .getAllColumns()
                    .filter((column) => {
                        return (
                            typeof column.accessorFn !== 'undefined' &&
                            column.getCanHide() &&
                            !column.columnDef.meta?.filterOnly
                        )
                    })
                    .map((column) => {
                        const columnLabel = getColumnViewLabel(
                            column.id,
                            column.columnDef.meta
                        )
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => {
                                    column.toggleVisibility(value)
                                }}
                            >
                                {columnLabel}
                            </DropdownMenuCheckboxItem>
                        )
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
