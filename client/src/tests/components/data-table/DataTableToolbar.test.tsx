import { DataTableToolbar } from '@/components/data-table/DataTableToolbar'
import type { DataTableToolbarConfig } from '@/models/data-table'
import { getMockProps } from '@/tests/utils'
import type { Table } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const spinnerMock = vi.fn()
const viewOptionsMock = vi.fn()
const facetedFilterMock = vi.fn()

vi.mock('@/components/ui/spinner', () => ({
    Spinner: (props: unknown) => {
        spinnerMock(props)
        return <div data-testid="mock-spinner" />
    },
}))
vi.mock('@/components/data-table/DataTableFacetedFilter', () => ({
    DataTableFacetedFilter: (props: unknown) => {
        facetedFilterMock(props)
        return <div data-testid="mock-filter" />
    },
}))
vi.mock('@/components/data-table/DataTableViewOptions', () => ({
    DataTableViewOptions: (props: unknown) => {
        viewOptionsMock(props)
        return <div data-testid="mock-view-options" />
    },
}))

function createConfig(
    overrides?: Partial<DataTableToolbarConfig>
): DataTableToolbarConfig {
    return {
        ...overrides,
    } as DataTableToolbarConfig
}

function createTableMock(overrides?: Partial<Table<unknown>>) {
    return {
        getState: () => ({
            columnFilters: [],
        }),
        getAllColumns: () => [],
        getColumn: vi.fn(() => ({
            getFilterValue: vi.fn(() => ''),
            setFilterValue: vi.fn(),
        })),
        ...overrides,
    } as unknown as Table<unknown>
}

const renderDataTableToolbar = (
    toolbarConfig: DataTableToolbarConfig,
    tableOverrides?: Partial<Table<unknown>>
) => {
    return render(
        <DataTableToolbar
            table={createTableMock(tableOverrides)}
            config={toolbarConfig}
        />
    )
}

describe('DataTableToolbar - search', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses config search value for external search', () => {
        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                    value: 'hello',
                    onChange: vi.fn(),
                },
            })
        )

        expect(screen.getByRole('textbox')).toHaveValue('hello')
    })

    it('uses column filter value for internal search', () => {
        const getColumnMock = vi.fn(() => ({
            getFilterValue: vi.fn(() => 'existing'),
            setFilterValue: vi.fn(),
        }))

        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                },
            }),
            {
                getColumn: getColumnMock as never,
            }
        )

        expect(screen.getByRole('textbox')).toHaveValue('existing')
    })

    it('does not render search input when config.search is not provided', () => {
        renderDataTableToolbar(createConfig())

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('renders search input when config.search is provided', () => {
        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                },
            })
        )

        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('calls onChange for external search', async () => {
        const onChange = vi.fn()

        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                    value: '',
                    onChange,
                },
            })
        )

        await userEvent.type(screen.getByRole('textbox'), 'abc')

        expect(onChange).toHaveBeenCalled()
    })

    it('falls back to empty string when search value is undefined', () => {
        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                    onChange: vi.fn(),
                },
            })
        )

        expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('updates column filter for internal search', async () => {
        const setFilterValue = vi.fn()

        const getColumnMock = vi.fn(() => ({
            getFilterValue: vi.fn(() => ''),
            setFilterValue,
        }))

        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                },
            }),
            {
                getColumn: getColumnMock as never,
            }
        )

        await userEvent.type(screen.getByRole('textbox'), 'abc')

        expect(setFilterValue).toHaveBeenCalled()
    })

    it('shows spinner when search is loading', () => {
        renderDataTableToolbar(
            createConfig({
                search: {
                    columnId: 'name',
                    placeholder: 'Search...',
                    isLoading: true,
                },
            })
        )

        expect(screen.getByTestId('mock-spinner')).toBeInTheDocument()
    })
})

describe('DataTableToolbar - view options', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders view options by default', () => {
        renderDataTableToolbar(createConfig())

        expect(viewOptionsMock).toHaveBeenCalled()
    })

    it('does not render view options when showViewOptions is false', () => {
        renderDataTableToolbar(
            createConfig({
                showViewOptions: false,
            })
        )

        expect(
            screen.queryByTestId('mock-view-options')
        ).not.toBeInTheDocument()
    })

    it('passes table to DataTableViewOptions', () => {
        renderDataTableToolbar(createConfig())

        expect(viewOptionsMock).toHaveBeenCalled()

        const props = getMockProps(viewOptionsMock)
        expect(props).toMatchObject({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            table: expect.any(Object),
        })
    })
})

describe('DataTableToolbar - actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does not render actions when not provided', () => {
        renderDataTableToolbar(createConfig())

        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders actions in both desktop and mobile sections', () => {
        renderDataTableToolbar(
            createConfig({
                actions: [
                    {
                        label: 'Add',
                        onClick: vi.fn(),
                    },
                ],
            })
        )

        expect(screen.getAllByText('Add')).toHaveLength(2)
    })

    it('calls action on click', async () => {
        const onClick = vi.fn()

        renderDataTableToolbar(
            createConfig({
                actions: [
                    {
                        label: 'Add',
                        onClick,
                    },
                ],
            })
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await userEvent.click(screen.getAllByText('Add')[0]!)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await userEvent.click(screen.getAllByText('Add')[1]!)

        expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('renders action icon when provided', () => {
        const Icon = () => <svg data-testid="mock-icon" />

        renderDataTableToolbar(
            createConfig({
                actions: [
                    {
                        label: 'Add',
                        onClick: vi.fn(),
                        icon: Icon,
                    },
                ],
            })
        )

        expect(screen.getAllByTestId('mock-icon')).toHaveLength(2)
    })
})

describe('DataTableToolbar - filters & reset', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders faceted filters when column exists', () => {
        const getColumnMock = vi.fn(() => ({}))

        renderDataTableToolbar(
            createConfig({
                filters: [
                    {
                        columnId: 'status',
                        title: 'Status',
                        options: [],
                    },
                ],
            }),
            {
                getColumn: getColumnMock as never,
            }
        )

        expect(screen.getByTestId('mock-filter')).toBeInTheDocument()
    })

    it('does not render filter when column does not exist', () => {
        const getColumnMock = vi.fn(() => undefined)

        renderDataTableToolbar(
            createConfig({
                filters: [
                    {
                        columnId: 'status',
                        title: 'Status',
                        options: [],
                    },
                ],
            }),
            {
                getColumn: getColumnMock as never,
            }
        )

        expect(screen.queryByTestId('mock-filter')).not.toBeInTheDocument()
    })

    it('passes correct props to DataTableFacetedFilter', () => {
        const column = {}

        const getColumnMock = vi.fn(() => column)

        renderDataTableToolbar(
            createConfig({
                filters: [
                    {
                        columnId: 'status',
                        title: 'Status',
                        options: [{ label: 'Active', value: 'active' }],
                    },
                ],
            }),
            {
                getColumn: getColumnMock as never,
            }
        )

        expect(facetedFilterMock).toHaveBeenCalled()

        const props = getMockProps(facetedFilterMock)
        expect(props).toMatchObject({
            column,
            title: 'Status',
            options: [{ label: 'Active', value: 'active' }],
        })
    })

    it('shows reset button when table is filtered', () => {
        renderDataTableToolbar(createConfig(), {
            getState: () =>
                ({
                    columnFilters: [{}],
                }) as never,
        })

        expect(screen.getByText('Reset')).toBeInTheDocument()
    })

    it('does not show reset button when table is not filtered', () => {
        renderDataTableToolbar(createConfig(), {
            getState: () =>
                ({
                    columnFilters: [],
                }) as never,
        })

        expect(screen.queryByText('Reset')).not.toBeInTheDocument()
    })

    it('resets filters when reset button is clicked', async () => {
        const resetColumnFilters = vi.fn()

        renderDataTableToolbar(createConfig(), {
            getState: () =>
                ({
                    columnFilters: [{}],
                }) as never,
            resetColumnFilters,
        })

        await userEvent.click(screen.getByText('Reset'))

        expect(resetColumnFilters).toHaveBeenCalled()
    })
})
