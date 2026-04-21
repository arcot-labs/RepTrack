import { cn } from '@/lib/utils'
import type {
    DataTableColumnMeta,
    EdgePaddingConfig,
} from '@/models/data-table'
import type { Cell, Header } from '@tanstack/react-table'

export function isTruncatedText(textElement: HTMLElement | null): boolean {
    if (!textElement) return false
    return textElement.offsetWidth < textElement.scrollWidth
}

export const getEdgePaddingClassName = (
    idx: number,
    lastIdx: number,
    columnId: string,
    edgePaddingConfig: EdgePaddingConfig,
    baseClassName?: string
) => {
    const paddingClasses = []

    if (
        idx === 0 &&
        !edgePaddingConfig.firstColumnExcludeIds.includes(columnId)
    )
        paddingClasses.push('pl-4')

    if (
        idx === lastIdx &&
        !edgePaddingConfig.lastColumnExcludeIds.includes(columnId)
    )
        paddingClasses.push('pr-4')

    if (paddingClasses.length === 0) return baseClassName

    return baseClassName
        ? `${baseClassName} ${paddingClasses.join(' ')}`
        : paddingClasses.join(' ')
}

function getColumnMeta(meta: unknown): DataTableColumnMeta | undefined {
    return meta as DataTableColumnMeta | undefined
}

export function getHeaderClassName<TData, TValue>(
    header: Header<TData, TValue>
): string | undefined {
    const headerMeta = getColumnMeta(header.column.columnDef.meta)
    return headerMeta?.headerClassName
}

export function getCellClassName<TData, TValue>(
    cell: Cell<TData, TValue>
): string | undefined {
    const cellMeta = getColumnMeta(cell.column.columnDef.meta)
    const isActionsColumn = cell.column.id === 'actions'
    return cn('h-10', isActionsColumn && 'py-1', cellMeta?.cellClassName)
}
