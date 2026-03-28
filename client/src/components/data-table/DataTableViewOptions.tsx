import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/overrides/button'
import { formatIdentifier } from '@/lib/text'

export interface DataTableColumnMeta {
    viewLabel?: string
    filterOnly?: boolean
    headerClassName?: string
    cellClassName?: string
}

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
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== 'undefined' &&
                            column.getCanHide() &&
                            !(
                                column.columnDef.meta as
                                    | DataTableColumnMeta
                                    | undefined
                            )?.filterOnly
                    )
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
