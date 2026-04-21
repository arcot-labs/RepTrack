import type {
    DataTableToolbarConfig,
    EdgePaddingConfig,
} from '@/models/data-table'
import { getMockProps } from '@/tests/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const matchMediaMock = vi.fn()

window.matchMedia = matchMediaMock

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
    columns: ColumnDef<unknown>[] = [],
    initialColumnVisibility?: Record<string, boolean>,
    edgePaddingConfig?: EdgePaddingConfig,
    toolbarConfig?: DataTableToolbarConfig,
    pageSize?: number
) => {
    const DataTable = (await import('@/components/data-table/DataTable'))
        .DataTable

    return render(
        <DataTable
            data={[]}
            columns={columns}
            edgePaddingConfig={edgePaddingConfig}
            toolbarConfig={toolbarConfig}
            pageSize={pageSize}
            initialColumnVisibility={initialColumnVisibility}
            isLoading={isLoading}
        />
    )
}

describe('DataTable', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        matchMediaMock.mockReturnValue({ matches: true })
        useReactTableMock.mockReturnValue({})
    })

    it('does not hide column with hideOnBelowMd when enableHiding is false', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [
                {
                    accessorKey: 'name',
                    meta: { hideOnBelowMd: true },
                    enableHiding: false,
                },
            ],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: {},
                }),
            })
        )
    })

    it('uses column id for responsive hiding when set', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [{ id: 'status', meta: { hideOnBelowMd: true } }],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: { status: false },
                }),
            })
        )
    })

    it('normalizes nested accessor keys for responsive hidden defaults', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [
                {
                    accessorKey: 'reviewer.username',
                    meta: { hideOnBelowMd: true },
                },
            ],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: { reviewer_username: false },
                }),
            })
        )
    })

    it('ignores column with hideOnBelowMd that has no id or accessorKey', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [
                {
                    accessorFn: (row: unknown) => row,
                    meta: { hideOnBelowMd: true },
                } as never,
            ],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: {},
                }),
            })
        )
    })

    it('does not apply responsive hidden defaults when view options are disabled', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [{ accessorKey: 'name', meta: { hideOnBelowMd: true } }],
            undefined,
            undefined,
            { showViewOptions: false }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: {},
                }),
            })
        )
    })

    it('does not apply responsive hidden defaults when toolbar config is missing', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(false, [
            { accessorKey: 'name', meta: { hideOnBelowMd: true } },
        ])

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: {},
                }),
            })
        )
    })

    it('starts configured columns hidden below md when view options are enabled', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [{ accessorKey: 'name', meta: { hideOnBelowMd: true } }],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: { name: false },
                }),
            })
        )
    })

    it('returns base visibility below md when no columns have hideOnBelowMd', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [{ accessorKey: 'name' }],
            undefined,
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: {},
                }),
            })
        )
    })

    it('maintains precedence of initial visibility over responsive defaults', async () => {
        matchMediaMock.mockReturnValue({ matches: false })

        await renderDataTable(
            false,
            [{ accessorKey: 'name', meta: { hideOnBelowMd: true } }],
            { name: true },
            undefined,
            { showViewOptions: true }
        )

        expect(useReactTableMock).toHaveBeenCalledWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                state: expect.objectContaining({
                    columnVisibility: { name: true },
                }),
            })
        )
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

        await renderDataTable(false, [], undefined, undefined, toolbarConfig)

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

        await renderDataTable(false, [], undefined, customConfig)

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
        await renderDataTable(false, [], undefined, undefined, undefined, 25)

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
