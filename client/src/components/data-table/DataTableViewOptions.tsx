import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { type Table } from '@tanstack/react-table'
import { Settings2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatIdentifier } from '@/lib/text'

interface DataTableColumnMeta {
    viewLabel?: string
    filterOnly?: boolean
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
                    className="ml-auto hidden h-8 lg:flex"
                >
                    <Settings2 />
                    View
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
