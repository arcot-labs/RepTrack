import {
    getCellClassName,
    getEdgePaddingClassName,
    getHeaderClassName,
} from '@/components/data-table/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    flexRender,
    type HeaderGroup,
    type Row,
    type Table as TableInstance,
} from '@tanstack/react-table'

export interface EdgePaddingConfig {
    firstColumnExcludeIds: string[]
    lastColumnExcludeIds: string[]
}

interface DataTableContentProps<TData> {
    table: TableInstance<TData>
    columnsLength: number
    edgePaddingConfig: EdgePaddingConfig
}

export function DataTableHeaderGroups<TData>({
    table,
    edgePaddingConfig,
}: {
    table: TableInstance<TData>
    edgePaddingConfig: EdgePaddingConfig
}) {
    return (
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <DataTableHeaderRow
                    key={headerGroup.id}
                    headerGroup={headerGroup}
                    edgePaddingConfig={edgePaddingConfig}
                />
            ))}
        </TableHeader>
    )
}

export function DataTableHeaderRow<TData>({
    headerGroup,
    edgePaddingConfig,
}: {
    headerGroup: HeaderGroup<TData>
    edgePaddingConfig: EdgePaddingConfig
}) {
    return (
        <TableRow>
            {headerGroup.headers.map((header, headerIdx) => (
                <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={getEdgePaddingClassName(
                        headerIdx,
                        headerGroup.headers.length - 1,
                        header.column.id,
                        edgePaddingConfig,
                        getHeaderClassName(header)
                    )}
                >
                    {header.isPlaceholder
                        ? null
                        : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                          )}
                </TableHead>
            ))}
        </TableRow>
    )
}

export function DataTableBodyRows<TData>({
    table,
    columnsLength,
    edgePaddingConfig,
}: {
    table: TableInstance<TData>
    columnsLength: number
    edgePaddingConfig: EdgePaddingConfig
}) {
    const rows = table.getRowModel().rows

    return (
        <TableBody>
            {rows.length ? (
                rows.map((row) => (
                    <DataTableBodyRow
                        key={row.id}
                        row={row}
                        edgePaddingConfig={edgePaddingConfig}
                    />
                ))
            ) : (
                <TableRow>
                    <TableCell
                        colSpan={columnsLength}
                        className="h-24 text-center"
                    >
                        No results
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    )
}

export function DataTableBodyRow<TData>({
    row,
    edgePaddingConfig,
}: {
    row: Row<TData>
    edgePaddingConfig: EdgePaddingConfig
}) {
    const cells = row.getVisibleCells()

    return (
        <TableRow data-state={row.getIsSelected() && 'selected'}>
            {cells.map((cell, cellIdx) => (
                <TableCell
                    key={cell.id}
                    className={getEdgePaddingClassName(
                        cellIdx,
                        cells.length - 1,
                        cell.column.id,
                        edgePaddingConfig,
                        getCellClassName(cell)
                    )}
                >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

export function DataTableContent<TData>({
    table,
    columnsLength,
    edgePaddingConfig,
}: DataTableContentProps<TData>) {
    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <DataTableHeaderGroups
                    table={table}
                    edgePaddingConfig={edgePaddingConfig}
                />
                <DataTableBodyRows
                    table={table}
                    columnsLength={columnsLength}
                    edgePaddingConfig={edgePaddingConfig}
                />
            </Table>
        </div>
    )
}
