import type { EdgePaddingConfig } from '@/components/data-table/DataTableContent'
import type { DataTableToolbarConfig } from '@/models/data-table'
import { getMockProps } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useReactTableMock = vi.fn()
const toolbarMock = vi.fn(() => <div data-testid="mock-toolbar" />)
const skeletonMock = vi.fn(() => <div data-testid="mock-skeleton" />)
const contentMock = vi.fn(() => <div data-testid="mock-content" />)
const paginationMock = vi.fn(() => <div data-testid="mock-pagination" />)

vi.mock('@tanstack/react-table', async () => {
    const actual = await vi.importActual('@tanstack/react-table')
    return {
        ...actual,
        useReactTable: useReactTableMock,
    }
})
vi.mock('@/components/data-table/DataTableToolbar', () => ({
    DataTableToolbar: toolbarMock,
}))
vi.mock('@/components/data-table/DataTableSkeleton', () => ({
    DataTableSkeleton: skeletonMock,
}))
vi.mock('@/components/data-table/DataTableContent', () => ({
    DataTableContent: contentMock,
}))
vi.mock('@/components/data-table/DataTablePagination', () => ({
    DataTablePagination: paginationMock,
}))

const renderDataTable = async (
    isLoading: boolean,
    edgePaddingConfig?: EdgePaddingConfig,
    toolbarConfig?: DataTableToolbarConfig,
    pageSize?: number
) => {
    const DataTable = (await import('@/components/data-table/DataTable'))
        .DataTable

    return render(
        <DataTable
            data={[]}
            columns={[]}
            edgePaddingConfig={edgePaddingConfig}
            toolbarConfig={toolbarConfig}
            pageSize={pageSize}
            isLoading={isLoading}
        />
    )
}

describe('DataTable', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        useReactTableMock.mockReturnValue({})
    })

    it('does not render toolbar when config is not provided', async () => {
        await renderDataTable(false)

        expect(screen.queryByTestId('mock-toolbar')).not.toBeInTheDocument()
    })

    it('renders toolbar when config is provided', async () => {
        const toolbarConfig: DataTableToolbarConfig = {
            search: {
                columnId: 'name',
                placeholder: 'Search...',
            },
        }

        await renderDataTable(false, undefined, toolbarConfig)

        expect(screen.getByTestId('mock-toolbar')).toBeInTheDocument()

        expect(toolbarMock).toHaveBeenCalledTimes(1)

        const props = getMockProps(toolbarMock)
        expect(props).toMatchObject({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            table: expect.any(Object),
            config: toolbarConfig,
        })
    })

    it('renders skeleton & pagination when loading', async () => {
        await renderDataTable(true)

        expect(screen.getByTestId('mock-skeleton')).toBeInTheDocument()
        expect(screen.queryByTestId('mock-content')).not.toBeInTheDocument()
        expect(screen.getByTestId('mock-pagination')).toBeInTheDocument()

        expect(skeletonMock).toHaveBeenCalledTimes(1)

        const skeletonProps = getMockProps(skeletonMock)
        expect(skeletonProps).toMatchObject({
            columnCount: 0,
        })

        expect(paginationMock).toHaveBeenCalledTimes(1)

        const paginationProps = getMockProps(paginationMock)
        expect(paginationProps).toMatchObject({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            table: expect.any(Object),
        })
    })

    it('renders content & pagination when not loading', async () => {
        await renderDataTable(false)

        expect(screen.queryByTestId('mock-skeleton')).not.toBeInTheDocument()
        expect(screen.getByTestId('mock-content')).toBeInTheDocument()
        expect(screen.getByTestId('mock-pagination')).toBeInTheDocument()

        expect(contentMock).toHaveBeenCalledTimes(1)

        const contentProps = getMockProps(contentMock)
        expect(contentProps).toMatchObject({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            table: expect.any(Object),
            columnsLength: 0,
            edgePaddingConfig: {
                firstColumnExcludeIds: ['actions'],
                lastColumnExcludeIds: ['actions'],
            },
        })
    })

    it('uses default edgePaddingConfig when not provided', async () => {
        await renderDataTable(false)

        const contentProps = getMockProps(contentMock)

        expect(contentProps).toMatchObject({
            edgePaddingConfig: {
                firstColumnExcludeIds: ['actions'],
                lastColumnExcludeIds: ['actions'],
            },
        })
    })

    it('uses provided edgePaddingConfig when passed', async () => {
        const customConfig = {
            firstColumnExcludeIds: ['id'],
            lastColumnExcludeIds: ['status'],
        }

        await renderDataTable(false, customConfig)

        const contentProps = getMockProps(contentMock)
        expect(contentProps).toMatchObject({
            edgePaddingConfig: customConfig,
        })
    })

    it('uses default pageSize when not provided', async () => {
        useReactTableMock.mockReturnValue({})

        await renderDataTable(false)

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                initialState: {
                    pagination: {
                        pageSize: 10,
                    },
                },
            })
        )
    })

    it('uses provided pageSize', async () => {
        await renderDataTable(false, undefined, undefined, 25)

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                initialState: {
                    pagination: {
                        pageSize: 25,
                    },
                },
            })
        )
    })
})
