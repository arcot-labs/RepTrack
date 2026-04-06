import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import type { Column } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('lucide-react', () => ({
    ArrowUp: vi.fn(() => <div data-testid="icon-asc" />),
    ArrowDown: vi.fn(() => <div data-testid="icon-desc" />),
    ChevronsUpDown: vi.fn(() => <div data-testid="icon-unsorted" />),
    EyeOff: () => <div data-testid="icon-hide" />,
    X: () => <div data-testid="icon-clear" />,
}))

interface DropdownContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: ReactNode }) => {
        const [open, setOpen] = useState(false)
        return (
            <DropdownContext.Provider value={{ open, setOpen }}>
                <div>{children}</div>
            </DropdownContext.Provider>
        )
    },
    DropdownMenuTrigger: ({ children }: { children: ReactNode }) => {
        const ctx = useContext(DropdownContext)
        return <div onClick={() => ctx?.setOpen(!ctx.open)}>{children}</div>
    },
    DropdownMenuContent: ({ children }: { children: ReactNode }) => {
        const ctx = useContext(DropdownContext)
        return ctx?.open ? <div>{children}</div> : null
    },
    DropdownMenuItem: ({
        children,
        onClick,
    }: {
        children: ReactNode
        onClick?: () => void
    }) => (
        <div role="menuitem" onClick={onClick}>
            {children}
        </div>
    ),
    DropdownMenuSeparator: () => <div data-testid="separator" />,
}))

function createColumnMock(overrides?: Partial<Column<unknown>>) {
    return {
        getCanHide: () => false,
        getIsSorted: () => false,
        getCanSort: () => false,
        ...overrides,
    } as Column<unknown>
}

const renderDataTableColumnHeader = (
    columnOverrides?: Partial<Column<unknown>>
) => {
    return render(
        <DataTableColumnHeader
            column={createColumnMock(columnOverrides)}
            title="Name"
        />
    )
}

describe('DataTableColumnHeader', () => {
    it('renders plain header when sorting and hiding are disabled', () => {
        renderDataTableColumnHeader()

        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders dropdown trigger when column is sortable', () => {
        renderDataTableColumnHeader({ getCanSort: () => true })

        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows sorting options when opened', async () => {
        renderDataTableColumnHeader({ getCanSort: () => true })

        await userEvent.click(screen.getByRole('button'))

        expect(screen.getByText('Ascending')).toBeInTheDocument()
        expect(screen.getByText('Descending')).toBeInTheDocument()
    })

    it('sorts ascending when clicking ascending option', async () => {
        const user = userEvent.setup()
        const toggleSorting = vi.fn()

        renderDataTableColumnHeader({
            getCanSort: () => true,
            toggleSorting,
        })

        await user.click(screen.getByRole('button'))
        await user.click(screen.getByText('Ascending'))

        expect(toggleSorting).toHaveBeenCalledWith(false)
    })

    it('sorts descending when clicking descending option', async () => {
        const user = userEvent.setup()
        const toggleSorting = vi.fn()

        renderDataTableColumnHeader({
            getCanSort: () => true,
            toggleSorting,
        })

        await user.click(screen.getByRole('button'))
        await user.click(screen.getByText('Descending'))

        expect(toggleSorting).toHaveBeenCalledWith(true)
    })

    it('shows unsorted icon when not sorted', () => {
        renderDataTableColumnHeader({
            getCanSort: () => true,
            getIsSorted: () => false,
        })

        expect(screen.getByTestId('icon-unsorted')).toBeInTheDocument()
        expect(screen.queryByTestId('icon-asc')).not.toBeInTheDocument()
        expect(screen.queryByTestId('icon-desc')).not.toBeInTheDocument()
    })

    it('shows ascending icon when sorted asc', () => {
        renderDataTableColumnHeader({
            getCanSort: () => true,
            getIsSorted: () => 'asc',
        })

        expect(screen.getByTestId('icon-asc')).toBeInTheDocument()
        expect(screen.queryByTestId('icon-desc')).not.toBeInTheDocument()
        expect(screen.queryByTestId('icon-unsorted')).not.toBeInTheDocument()
    })

    it('shows descending icon when sorted desc', () => {
        renderDataTableColumnHeader({
            getCanSort: () => true,
            getIsSorted: () => 'desc',
        })

        expect(screen.getByTestId('icon-desc')).toBeInTheDocument()
        expect(screen.queryByTestId('icon-asc')).not.toBeInTheDocument()
        expect(screen.queryByTestId('icon-unsorted')).not.toBeInTheDocument()
    })

    it('shows and clears sorting when already sorted', async () => {
        const user = userEvent.setup()
        const clearSorting = vi.fn()

        renderDataTableColumnHeader({
            getCanSort: () => true,
            getIsSorted: () => 'asc',
            clearSorting,
        })

        await user.click(screen.getByRole('button'))
        await user.click(screen.getByText('Clear'))

        expect(clearSorting).toHaveBeenCalled()
    })

    it('shows hide option when column is hideable', async () => {
        renderDataTableColumnHeader({
            getCanHide: () => true,
        })

        await userEvent.click(screen.getByRole('button'))

        expect(screen.getByText('Hide')).toBeInTheDocument()
    })

    it('hides column when clicking hide', async () => {
        const user = userEvent.setup()
        const toggleVisibility = vi.fn()

        renderDataTableColumnHeader({
            getCanHide: () => true,
            toggleVisibility,
        })

        await user.click(screen.getByRole('button'))
        await user.click(screen.getByText('Hide'))

        expect(toggleVisibility).toHaveBeenCalledWith(false)
    })

    it('shows separator when both sorting and hiding are enabled', async () => {
        renderDataTableColumnHeader({
            getCanSort: () => true,
            getCanHide: () => true,
        })

        await userEvent.click(screen.getByRole('button'))

        expect(screen.getByTestId('separator')).toBeInTheDocument()
    })
})
