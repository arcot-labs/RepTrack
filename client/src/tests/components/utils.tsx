import type { UserPublic } from '@/api/generated'
import { getMockProps } from '@/tests/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { expect, vi } from 'vitest'

export const dataTableMock = vi.fn()
export const headerMock = vi.fn()

vi.mock('@/components/data-table/DataTable', () => ({
    DataTable: (props: unknown) => {
        dataTableMock(props)
        return <div data-testid="mock-users-table" />
    },
}))

vi.mock('@/components/data-table/DataTableColumnHeader', () => ({
    DataTableColumnHeader: (props: unknown) => {
        headerMock(props)
        return <div data-testid="mock-data-table-column-header" />
    },
}))

export const getDataTableProps = () =>
    getMockProps(dataTableMock) as {
        columns: ColumnDef<UserPublic>[]
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

export function getColumn(
    columns: ColumnDef<UserPublic>[],
    predicate: (col: ColumnDef<UserPublic>) => boolean
): ColumnDef<UserPublic> {
    const col = columns.find(predicate)
    expect(col).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return col!
}

export function testHeader(
    column: ColumnDef<UserPublic>,
    id: string,
    expectedTitle: string
) {
    if (!hasHeader(column)) throw new Error('Column does not have a header')

    const mockColumn = { id }
    const header = column.header({ column: mockColumn } as unknown)
    render(header)

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

export function renderCell(column: ColumnDef<UserPublic>, row: UserPublic) {
    if (!hasCell(column)) throw new Error('Column does not have a cell')

    const cell = column.cell({
        row: { original: row },
    } as unknown)
    return render(cell)
}
