import { DataTableFacetedFilter } from '@/components/data-table/DataTableFacetedFilter'
import type { Column } from '@tanstack/react-table'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

/* eslint-disable */
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}
window.HTMLElement.prototype.scrollIntoView = vi.fn()
/* eslint-enable */

interface PopoverContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

vi.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: { children: ReactNode }) => {
        const [open, setOpen] = useState(false)
        return (
            <PopoverContext.Provider value={{ open, setOpen }}>
                <div>{children}</div>
            </PopoverContext.Provider>
        )
    },
    PopoverTrigger: ({ children }: { children: ReactNode }) => {
        const ctx = useContext(PopoverContext)
        return <div onClick={() => ctx?.setOpen(!ctx.open)}>{children}</div>
    },
    PopoverContent: ({ children }: { children: ReactNode }) => {
        const ctx = useContext(PopoverContext)
        return ctx?.open ? <div>{children}</div> : null
    },
}))

function createColumnMock(overrides?: Partial<Column<unknown>>) {
    return {
        getFacetedUniqueValues: vi.fn(() => new Map()),
        getFilterValue: vi.fn(() => []),
        setFilterValue: vi.fn(),
        ...overrides,
    } as unknown as Column<unknown>
}

type DataTableFacetedFilterProps = Parameters<typeof DataTableFacetedFilter>[0]

const renderDataTableFacetedFilter = (
    columnOverrides?: Partial<Column<unknown>>,
    optionsOverrides?: DataTableFacetedFilterProps['options']
) => {
    return render(
        <DataTableFacetedFilter
            title="Test Filter"
            column={createColumnMock(columnOverrides)}
            options={optionsOverrides ?? []}
        />
    )
}

const getFilterButton = () =>
    screen.getByRole('button', { name: /test filter/i })

describe('DataTableFacetedFilter', () => {
    it('renders filter button with title', () => {
        renderDataTableFacetedFilter()

        expect(getFilterButton()).toBeInTheDocument()
    })

    it('shows selected values when filters are active', () => {
        const column = createColumnMock({
            getFilterValue: () => ['option-1', 'option-3'],
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
        ])

        expect(screen.getByText('Option 1')).toBeInTheDocument()
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
        expect(screen.getByText('Option 3')).toBeInTheDocument()
    })

    it('shows selected count when more than 2 filters are active', () => {
        const column = createColumnMock({
            getFilterValue: () => ['option-1', 'option-2', 'option-3'],
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
        ])

        expect(screen.getByText('3 selected')).toBeInTheDocument()
    })

    it('adds value when option is selected', async () => {
        const setFilterValue = vi.fn()
        const column = createColumnMock({
            getFilterValue: () => ['option-2'],
            setFilterValue,
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
        ])

        const user = userEvent.setup()
        await user.click(getFilterButton())
        await user.click(screen.getByRole('option', { name: /option 1/i }))

        expect(setFilterValue).toHaveBeenCalledWith(['option-2', 'option-1'])
    })

    it('removes value when option is deselected', async () => {
        const setFilterValue = vi.fn()
        const column = createColumnMock({
            getFilterValue: () => ['option-1', 'option-2'],
            setFilterValue,
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
        ])

        const user = userEvent.setup()
        await user.click(getFilterButton())
        await user.click(screen.getByRole('option', { name: /option 1/i }))

        expect(setFilterValue).toHaveBeenCalledWith(['option-2'])
    })

    it('sets filter value to undefined when all options are deselected', async () => {
        const setFilterValue = vi.fn()
        const column = createColumnMock({
            getFilterValue: () => ['option-1'],
            setFilterValue,
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
        ])

        const user = userEvent.setup()
        await user.click(getFilterButton())
        await user.click(screen.getByRole('option', { name: /option 1/i }))

        expect(setFilterValue).toHaveBeenCalledWith(undefined)
    })

    it('shows facet count for each option', async () => {
        const facetMap = new Map([
            ['option-1', 42],
            ['option-2', 7],
        ])
        const column = createColumnMock({
            getFacetedUniqueValues: vi.fn(() => facetMap),
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
        ])

        await userEvent.click(getFilterButton())

        expect(
            within(screen.getByRole('option', { name: /option 1/i })).getByText(
                '42'
            )
        ).toBeInTheDocument()
        expect(
            within(screen.getByRole('option', { name: /option 2/i })).getByText(
                '7'
            )
        ).toBeInTheDocument()
    })

    it('shows 0 facet count when option has no data', async () => {
        renderDataTableFacetedFilter(undefined, [
            { label: 'Option 1', value: 'option-1' },
        ])

        await userEvent.click(getFilterButton())

        expect(
            within(screen.getByRole('option', { name: /option 1/i })).getByText(
                '0'
            )
        ).toBeInTheDocument()
    })

    it('renders icon for option when provided', async () => {
        const Icon = () => <div data-testid="option-icon" />
        const setFilterValue = vi.fn()
        const column = createColumnMock({
            getFilterValue: () => [],
            setFilterValue,
        })
        renderDataTableFacetedFilter(column, [
            {
                label: 'Option 1',
                value: 'option-1',
                icon: Icon,
            },
        ])

        await userEvent.click(getFilterButton())

        expect(
            screen.getByRole('option', { name: /option 1/i })
        ).toContainElement(screen.getByTestId('option-icon'))
    })

    it('does not render clear filters button when no filters are active', async () => {
        const column = createColumnMock({
            getFilterValue: () => [],
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
        ])

        const user = userEvent.setup()
        await user.click(getFilterButton())

        expect(screen.queryByText('Clear filters')).not.toBeInTheDocument()
    })

    it('clears all filters', async () => {
        const setFilterValue = vi.fn()
        const column = createColumnMock({
            getFilterValue: () => ['option-1'],
            setFilterValue,
        })
        renderDataTableFacetedFilter(column, [
            { label: 'Option 1', value: 'option-1' },
        ])

        const user = userEvent.setup()
        await user.click(getFilterButton())
        await user.click(screen.getByText('Clear filters'))

        expect(setFilterValue).toHaveBeenCalledWith(undefined)
    })
})
