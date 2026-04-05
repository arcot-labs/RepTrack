import { DataTableViewOptions } from '@/components/data-table/DataTableViewOptions'
import type { Column, Table } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { formatIdentifierMock } = vi.hoisted(() => ({
    formatIdentifierMock: vi.fn((id: string) => `formatted-${id}`),
}))

vi.mock('@/lib/text', () => ({
    formatIdentifier: formatIdentifierMock,
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
    DropdownMenuCheckboxItem: ({
        children,
        checked,
        onCheckedChange,
    }: {
        children: ReactNode
        checked: boolean
        onCheckedChange: (checked: boolean) => void
    }) => (
        <div
            role="menuitemcheckbox"
            aria-checked={checked}
            onClick={() => {
                onCheckedChange(!checked)
            }}
        >
            {children}
        </div>
    ),
    DropdownMenuLabel: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuSeparator: () => <div />,
}))

function createColumnMock(overrides?: Partial<Column<unknown>>) {
    return {
        accessorFn: () => undefined,
        getCanHide: () => true,
        getIsVisible: () => true,
        columnDef: {},
        ...overrides,
    } as unknown as Column<unknown>
}

function createTableMock(
    columns: Column<unknown>[],
    overrides?: Partial<Table<unknown>>
) {
    return {
        getAllColumns: () => columns,
        ...overrides,
    } as unknown as Table<unknown>
}

const renderDataTableViewOptions = (
    tableOverrides?: Partial<Table<unknown>>
) => {
    return render(
        <DataTableViewOptions table={createTableMock([], tableOverrides)} />
    )
}

const getViewButton = () =>
    screen.getByRole('button', { name: /view options/i })

describe('DataTableViewOptions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders view options trigger', () => {
        renderDataTableViewOptions()

        expect(
            screen.getByRole('button', { name: /view options/i })
        ).toBeInTheDocument()
    })

    it('opens dropdown and renders column options', async () => {
        const columns = [
            createColumnMock({ id: 'col1' }),
            createColumnMock({ id: 'col2' }),
        ]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        await userEvent.click(getViewButton())

        expect(screen.getByText('formatted-col1')).toBeInTheDocument()
        expect(screen.getByText('formatted-col2')).toBeInTheDocument()
    })

    it('filters out non-hideable, filterOnly, and non-accessor columns', async () => {
        const columns = [
            createColumnMock({
                id: 'no-accessor',
                accessorFn: undefined,
            }),
            createColumnMock({
                id: 'cannot-hide',
                getCanHide: () => false,
            }),
            createColumnMock({
                id: 'filter-only',
                columnDef: { meta: { filterOnly: true } } as never,
            }),
        ]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        await userEvent.click(getViewButton())

        expect(
            screen.queryByText('formatted-no-accessor')
        ).not.toBeInTheDocument()
        expect(
            screen.queryByText('formatted-cannot-hide')
        ).not.toBeInTheDocument()
        expect(
            screen.queryByText('formatted-filter-only')
        ).not.toBeInTheDocument()
    })

    it('uses meta viewLabel when provided', async () => {
        const columns = [
            createColumnMock({
                id: 'col1',
                columnDef: { meta: { viewLabel: 'Custom Label' } } as never,
            }),
        ]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        await userEvent.click(getViewButton())

        expect(screen.getByText('Custom Label')).toBeInTheDocument()
        expect(formatIdentifierMock).not.toHaveBeenCalled()
    })

    it('falls back to formatIdentifier when no viewLabel is provided', async () => {
        const columns = [createColumnMock({ id: 'col1' })]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        await userEvent.click(getViewButton())

        expect(screen.getByText('formatted-col1')).toBeInTheDocument()
        expect(formatIdentifierMock).toHaveBeenCalledWith('col1')
    })

    it('sets checkbox checked state based on column visibility', async () => {
        const columns = [
            createColumnMock({
                id: 'col1',
                getIsVisible: () => true,
            }),
        ]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        await userEvent.click(getViewButton())

        const item = screen.getByRole('menuitemcheckbox')
        expect(item).toHaveAttribute('aria-checked', 'true')
    })

    it('toggles column visibility when clicked', async () => {
        const toggle1 = vi.fn()
        const toggle2 = vi.fn()
        const columns = [
            createColumnMock({
                id: 'col1',
                getIsVisible: () => true,
                toggleVisibility: toggle1,
            }),
            createColumnMock({
                id: 'col2',
                getIsVisible: () => false,
                toggleVisibility: toggle2,
            }),
        ]
        renderDataTableViewOptions({
            getAllColumns: () => columns,
        })

        const user = userEvent.setup()
        await user.click(getViewButton())

        const items = screen.getAllByRole('menuitemcheckbox')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await user.click(items[0]!)

        expect(toggle1).toHaveBeenCalledWith(false)
        expect(toggle2).not.toHaveBeenCalled()
    })
})
