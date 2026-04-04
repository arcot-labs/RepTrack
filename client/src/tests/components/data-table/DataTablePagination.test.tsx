import { DataTablePagination } from '@/components/data-table/DataTablePagination'
import { type Table } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

function createTableMock(overrides?: Partial<Table<unknown>>) {
    return {
        getPageCount: () => 3,
        getState: () => ({
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        }),
        getAllColumns: () => [],
        getFilteredRowModel: () => ({
            rows: Array.from({ length: 30 }, () => ({})),
        }),
        getCanPreviousPage: () => false,
        getCanNextPage: () => false,
        ...overrides,
    } as unknown as Table<unknown>
}

const renderDataTablePagination = (
    tableOverrides?: Partial<Table<unknown>>
) => {
    return render(
        <DataTablePagination table={createTableMock(tableOverrides)} />
    )
}

describe('DataTablePagination - pages & rows', () => {
    it('displays page text', () => {
        renderDataTablePagination()

        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('displays page text with 0 pages', () => {
        renderDataTablePagination({
            getPageCount: () => 0,
        })

        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    })

    it('displays row text with select column', () => {
        const table = createTableMock({
            getAllColumns: () => [{ id: 'select' }] as never,
            getFilteredSelectedRowModel: () =>
                ({
                    rows: [{}, {}],
                }) as never,
        })

        renderDataTablePagination(table)

        expect(screen.getByText('2 of 30 row(s) selected')).toBeInTheDocument()
    })

    it('displays row text without select column', () => {
        renderDataTablePagination()

        expect(screen.getByText('1-10 of 30 row(s)')).toBeInTheDocument()
    })

    it('displays row text without select column with 0 rows', () => {
        renderDataTablePagination({
            getFilteredRowModel: () =>
                ({
                    rows: [],
                }) as never,
        })

        expect(screen.getByText('0 rows')).toBeInTheDocument()
    })
})

describe('DataTablePagination - page size', () => {
    it('updates page size when selection changes', async () => {
        const setPageSize = vi.fn()
        const table = createTableMock({ setPageSize })
        renderDataTablePagination(table)

        window.HTMLElement.prototype.scrollIntoView = vi.fn()
        window.HTMLElement.prototype.hasPointerCapture = vi.fn()

        const user = userEvent.setup()
        await user.click(screen.getByRole('combobox'))
        await user.click(screen.getByText('25'))

        expect(setPageSize).toHaveBeenCalledWith(25)
    })
})

const getButtons = () => ({
    first: screen.getByRole('button', { name: /first page/i }),
    previous: screen.getByRole('button', { name: /previous page/i }),
    next: screen.getByRole('button', { name: /next page/i }),
    last: screen.getByRole('button', { name: /last page/i }),
})

describe('DataTablePagination - pagination buttons', () => {
    it('disables previous and first buttons on first page', () => {
        renderDataTablePagination({
            getCanPreviousPage: () => false,
        })

        const { first, previous } = getButtons()

        expect(first).toBeDisabled()
        expect(previous).toBeDisabled()
    })

    it('disables next and last buttons on last page', () => {
        renderDataTablePagination({
            getCanNextPage: () => false,
        })

        const { next, last } = getButtons()

        expect(next).toBeDisabled()
        expect(last).toBeDisabled()
    })

    it('goes to first page when clicking first button', async () => {
        const setPageIndex = vi.fn()
        const table = createTableMock({
            getCanPreviousPage: () => true,
            setPageIndex,
        })
        renderDataTablePagination(table)

        const { first } = getButtons()
        await userEvent.click(first)

        expect(setPageIndex).toHaveBeenCalledWith(0)
    })

    it('calls previousPage when clicking previous', async () => {
        const previousPage = vi.fn()
        const table = createTableMock({
            getCanPreviousPage: () => true,
            previousPage,
        })
        renderDataTablePagination(table)

        const { previous } = getButtons()
        await userEvent.click(previous)

        expect(previousPage).toHaveBeenCalled()
    })

    it('calls nextPage when clicking next', async () => {
        const nextPage = vi.fn()
        const table = createTableMock({
            getCanNextPage: () => true,
            nextPage,
        })
        renderDataTablePagination(table)

        const { next } = getButtons()
        await userEvent.click(next)

        expect(nextPage).toHaveBeenCalled()
    })

    it('goes to last page when clicking last button', async () => {
        const setPageIndex = vi.fn()
        const table = createTableMock({
            getPageCount: () => 5,
            getCanNextPage: () => true,
            setPageIndex,
        })
        renderDataTablePagination(table)

        const { last } = getButtons()
        await userEvent.click(last)

        expect(setPageIndex).toHaveBeenCalledWith(4)
    })
})
