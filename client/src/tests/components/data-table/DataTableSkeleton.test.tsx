import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const skeletonMock = vi.fn(() => <div data-testid="mock-skeleton" />)

vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: skeletonMock,
}))

const renderDataTableSkeleton = async (columnCount: number) => {
    const DataTableSkeleton = (
        await import('@/components/data-table/DataTableSkeleton')
    ).DataTableSkeleton

    return render(<DataTableSkeleton columnCount={columnCount} />)
}

describe('DataTableSkeleton', () => {
    it('renders correct number of header cells', async () => {
        await renderDataTableSkeleton(3)

        const headers = screen.getAllByRole('columnheader')
        expect(headers).toHaveLength(3)
    })

    it('renders 5 rows in the table body', async () => {
        await renderDataTableSkeleton(3)

        const rows = screen.getAllByRole('row')
        // 1 header row, 5 body rows
        expect(rows).toHaveLength(6)
    })

    it('renders correct number of body cells', async () => {
        await renderDataTableSkeleton(4)

        const cells = screen.getAllByRole('cell')
        expect(cells).toHaveLength(5 * 4)
    })

    it('renders correct number of skeleton components', async () => {
        await renderDataTableSkeleton(2)

        const skeletons = screen.getAllByTestId('mock-skeleton')
        expect(skeletons).toHaveLength(2 + 10)
    })
})
