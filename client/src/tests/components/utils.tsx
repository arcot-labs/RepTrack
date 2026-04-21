import { getMockProps } from '@/tests/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { expect, vi } from 'vitest'

export const dataTableMock = vi.fn()
export const headerMock = vi.fn()

vi.mock('@/components/data-table/DataTable', () => ({
    DataTable: (props: unknown) => {
        dataTableMock(props)
        return <div data-testid="mock-data-table" />
    },
}))

vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
    DataTableColumnHeader: (props: unknown) => {
        headerMock(props)
        return <div data-testid="mock-data-table-column-header" />
    },
}))

export function getDataTableProps<T>() {
    return getMockProps(dataTableMock) as {
        columns: ColumnDef<T>[]
    }
}

export function hasAccessorFn<T>(
    col: ColumnDef<T>
): col is ColumnDef<T> & { accessorFn: (row: T, index: number) => unknown } {
    return 'accessorFn' in col && typeof col.accessorFn === 'function'
}

export function hasAccessorKey<T>(
    col: ColumnDef<T>
): col is ColumnDef<T> & { accessorKey: string } {
    return 'accessorKey' in col
}

export function hasHeader<T>(col: ColumnDef<T>): col is ColumnDef<T> & {
    header: (ctx: unknown) => React.ReactNode
} {
    return 'header' in col && typeof col.header === 'function'
}

export function hasCell<T>(col: ColumnDef<T>): col is ColumnDef<T> & {
    cell: (ctx: unknown) => React.ReactNode
} {
    return 'cell' in col && typeof col.cell === 'function'
}

export function hasFilterFn<T>(col: ColumnDef<T>): col is ColumnDef<T> & {
    filterFn: (row: unknown, id: string, value: unknown) => boolean
} {
    return 'filterFn' in col && typeof col.filterFn === 'function'
}

export function hasGetUniqueValues<T>(
    col: ColumnDef<T>
): col is ColumnDef<T> & {
    getUniqueValues: (row: T) => unknown
} {
    return 'getUniqueValues' in col && typeof col.getUniqueValues === 'function'
}

export function getColumn<T>(
    columns: ColumnDef<T>[],
    predicate: (col: ColumnDef<T>) => boolean
): ColumnDef<T> {
    const col = columns.find(predicate)
    expect(col).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return col!
}

export function testHeader<T>(
    column: ColumnDef<T>,
    id: string,
    expectedTitle: string,
    expectMockedHeader = true
) {
    if (!hasHeader(column)) throw new Error('Column does not have a header')

    const mockColumn = {
        id,
        getCanSort: () => false,
        getCanHide: () => false,
        getIsSorted: () => false,
        toggleSorting: vi.fn(),
        clearSorting: vi.fn(),
        toggleVisibility: vi.fn(),
    }
    const header = column.header({ column: mockColumn } as unknown)
    render(header)

    if (!expectMockedHeader) {
        expect(screen.getByText(expectedTitle)).toBeInTheDocument()
        return
    }

    expect(
        screen.getByTestId('mock-data-table-column-header')
    ).toBeInTheDocument()
    expect(headerMock).toHaveBeenCalledWith(
        expect.objectContaining({
            column: mockColumn,
            title: expectedTitle,
        })
    )
}

export function renderCell<T>(column: ColumnDef<T>, row: T) {
    if (!hasCell(column)) throw new Error('Column does not have a cell')

    const cell = column.cell({
        row: { original: row },
    } as unknown)
    return render(cell)
}
