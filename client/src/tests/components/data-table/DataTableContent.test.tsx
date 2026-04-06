import {
    DataTableBodyRows,
    DataTableContent,
    DataTableHeaderGroups,
} from '@/components/data-table/DataTableContent'
import type {
    Cell,
    Header,
    HeaderGroup,
    Row,
    Table as TableInstance,
} from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { flexRenderMock } = vi.hoisted(() => ({
    flexRenderMock: vi.fn((value: unknown) => value),
}))

vi.mock('@tanstack/react-table', () => {
    return {
        flexRender: flexRenderMock,
    }
})

vi.mock('@/components/ui/table', () => ({
    Table: ({ children }: { children: ReactNode }) => <table>{children}</table>,
    TableHeader: ({ children }: { children: ReactNode }) => (
        <thead>{children}</thead>
    ),
    TableBody: ({ children }: { children: ReactNode }) => (
        <tbody>{children}</tbody>
    ),
    TableRow: ({ children, ...props }: { children: ReactNode }) => (
        <tr {...props}>{children}</tr>
    ),
    TableHead: ({ children, ...props }: { children: ReactNode }) => (
        <th {...props}>{children}</th>
    ),
    TableCell: ({ children, ...props }: { children: ReactNode }) => (
        <td {...props}>{children}</td>
    ),
}))

beforeEach(() => {
    flexRenderMock.mockReset()
})

function createTableMock(
    headerGroups: HeaderGroup<unknown>[]
): TableInstance<unknown> {
    return {
        getHeaderGroups: () => headerGroups,
    } as unknown as TableInstance<unknown>
}

function createHeaderGroup(
    headers: Header<unknown, unknown>[]
): HeaderGroup<unknown> {
    return {
        id: headers[0]?.id ?? 'group-1',
        headers,
    } as unknown as HeaderGroup<unknown>
}

type HeaderOverrides = Partial<{
    columnId: string
    id: string
    header: string
    colSpan: number
    isPlaceholder: boolean
    meta: { headerClassName?: string }
}>

function createHeader(
    overrides: HeaderOverrides = {}
): Header<unknown, unknown> {
    const columnId = overrides.columnId ?? 'column-1'

    return {
        id: overrides.id ?? `header-${columnId}`,
        colSpan: overrides.colSpan ?? 1,
        isPlaceholder: overrides.isPlaceholder ?? false,
        column: {
            id: columnId,
            columnDef: {
                header: overrides.header ?? columnId,
                meta: overrides.meta,
            },
        },
        getContext: () => ({}),
    } as Header<unknown, unknown>
}

type RowOverrides = Partial<{
    id: string
    cells: Cell<unknown, unknown>[]
    isSelected: boolean
}>

function createRow(overrides: RowOverrides = {}): Row<unknown> {
    const cells = overrides.cells ?? []

    return {
        id: overrides.id ?? 'row-1',
        getVisibleCells: () => cells,
        getIsSelected: () => overrides.isSelected ?? false,
    } as Row<unknown>
}

type CellOverrides = Partial<{
    columnId: string
    id: string
    value: string
    cell?: string
    meta: { cellClassName?: string }
}>

function createCell(overrides: CellOverrides = {}): Cell<unknown, unknown> {
    const columnId = overrides.columnId ?? 'column-1'
    const value = overrides.value ?? columnId

    return {
        id: overrides.id ?? `${columnId}-cell`,
        column: {
            id: columnId,
            columnDef: {
                cell: overrides.cell ?? value,
                meta: overrides.meta,
            },
        },
        getContext: () => ({}),
    } as unknown as Cell<unknown, unknown>
}

function createTableWithRows(rows: Row<unknown>[]): TableInstance<unknown> {
    return {
        getRowModel: () => ({
            rows,
        }),
    } as unknown as TableInstance<unknown>
}

const defaultEdgePaddingConfig = {
    firstColumnExcludeIds: [],
    lastColumnExcludeIds: [],
}
const renderDataTableHeaderGroups = (headerGroups: HeaderGroup<unknown>[]) => {
    return render(
        <table>
            <DataTableHeaderGroups
                table={createTableMock(headerGroups)}
                edgePaddingConfig={defaultEdgePaddingConfig}
            />
        </table>
    )
}

const renderDataTableBodyRows = (
    rows: Row<unknown>[],
    columnsLength: number
) => {
    return render(
        <table>
            <DataTableBodyRows
                table={createTableWithRows(rows)}
                columnsLength={columnsLength}
                edgePaddingConfig={defaultEdgePaddingConfig}
            />
        </table>
    )
}

const renderDataTableContent = (
    headerGroups: HeaderGroup<unknown>[],
    rows: Row<unknown>[],
    columnsLength: number
) => {
    return render(
        <DataTableContent
            table={
                {
                    getHeaderGroups: () => headerGroups,
                    getRowModel: () => ({ rows }),
                } as unknown as TableInstance<unknown>
            }
            columnsLength={columnsLength}
            edgePaddingConfig={defaultEdgePaddingConfig}
        />
    )
}

describe('DataTableHeaderGroups & DataTableHeaderRow', () => {
    it('renders headers', () => {
        const headerGroup = createHeaderGroup([
            createHeader({
                columnId: 'name',
                header: 'Name',
                meta: { headerClassName: 'font-semibold' },
            }),
            createHeader({
                columnId: 'email',
                header: 'Email',
                meta: { headerClassName: 'text-right' },
            }),
        ])

        renderDataTableHeaderGroups([headerGroup])

        const columnHeaders = screen.getAllByRole('columnheader')
        expect(columnHeaders).toHaveLength(2)
        expect(columnHeaders[0]).toHaveTextContent('Name')
        expect(columnHeaders[0]).toHaveClass('font-semibold', 'pl-4')
        expect(columnHeaders[1]).toHaveClass('text-right', 'pr-4')

        expect(flexRenderMock).toHaveBeenCalledTimes(2)
        expect(flexRenderMock).toHaveBeenCalledWith('Name', expect.anything())
        expect(flexRenderMock).toHaveBeenCalledWith('Email', expect.anything())
    })

    it('does not render flex content for placeholder headers', () => {
        const headerGroup = createHeaderGroup([
            createHeader({ columnId: 'visible', header: 'Visible' }),
            createHeader({
                columnId: 'placeholder',
                header: 'Placeholder',
                isPlaceholder: true,
            }),
        ])

        renderDataTableHeaderGroups([headerGroup])

        expect(screen.getByText('Visible')).toBeInTheDocument()
        expect(flexRenderMock).toHaveBeenCalledTimes(1)

        const headers = screen.getAllByRole('columnheader')
        expect(headers[1]).toBeEmptyDOMElement()
    })
})

describe('DataTableBodyRows & DataTableBodyRow', () => {
    it('renders rows', () => {
        const rows = [
            createRow({
                id: 'row-1',
                isSelected: true,
                cells: [
                    createCell({
                        columnId: 'name',
                        value: 'Alice',
                        meta: { cellClassName: 'text-red' },
                    }),
                    createCell({
                        columnId: 'email',
                        value: 'alice@example.com',
                        meta: { cellClassName: 'text-blue' },
                    }),
                ],
            }),
            createRow({
                id: 'row-2',
                cells: [
                    createCell({ columnId: 'name', value: 'Bob' }),
                    createCell({ columnId: 'email', value: 'bob@example.com' }),
                ],
            }),
        ]

        renderDataTableBodyRows(rows, 2)

        const cells = screen.getAllByRole('cell')
        expect(cells).toHaveLength(4)
        expect(cells[0]).toHaveTextContent('Alice')
        expect(cells[0]).toHaveClass('text-red', 'pl-4', 'h-10')
        expect(cells[1]).toHaveTextContent('alice@example.com')
        expect(cells[1]).toHaveClass('text-blue', 'pr-4', 'h-10')

        const selectedRow = screen.getByText('Alice').closest('tr')
        expect(selectedRow).toHaveAttribute('data-state', 'selected')
        expect(flexRenderMock).toHaveBeenCalledTimes(4)
    })

    it('shows no results when there are no rows', () => {
        renderDataTableBodyRows([], 3)

        const noResultsCell = screen.getByText('No results')
        expect(noResultsCell).toBeInTheDocument()
        expect(noResultsCell).toHaveAttribute('colspan', '3')
    })
})

describe('DataTableContent', () => {
    it('renders wrapper, headers, and rows', () => {
        const headerGroups = [
            createHeaderGroup([
                createHeader({ columnId: 'name', header: 'Name' }),
            ]),
        ]
        const rows = [
            createRow({
                cells: [
                    createCell({ columnId: 'name', value: 'Alice' }),
                    createCell({
                        columnId: 'email',
                        value: 'alice@example.com',
                    }),
                ],
            }),
        ]

        renderDataTableContent(headerGroups, rows, 2)

        const table = screen.getByRole('table')
        expect(table.parentElement).toHaveClass(
            'overflow-hidden',
            'rounded-md',
            'border'
        )

        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('displays empty state when there are no rows', () => {
        const headerGroups = [
            createHeaderGroup([
                createHeader({ columnId: 'name', header: 'Name' }),
            ]),
        ]

        renderDataTableContent(headerGroups, [], 4)

        const noResultsCell = screen.getByText('No results')
        expect(noResultsCell).toHaveAttribute('colspan', '4')
    })
})
