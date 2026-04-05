import { DataTableRowActions } from '@/components/data-table/DataTableRowActions'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import type { Row } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, type ReactNode, useContext, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('lucide-react', () => ({
    MoreHorizontal: vi.fn(() => <div data-testid="icon-more" />),
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
        onSelect,
        disabled,
    }: {
        children: ReactNode
        onSelect?: () => void
        disabled?: boolean
    }) => (
        <div
            role="menuitem"
            aria-disabled={disabled}
            onClick={() => !disabled && onSelect?.()}
        >
            {children}
        </div>
    ),
    DropdownMenuSeparator: () => <div data-testid="separator" />,
    DropdownMenuShortcut: ({ children }: { children: ReactNode }) => (
        <span data-testid="shortcut">{children}</span>
    ),
    DropdownMenuSub: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuSubTrigger: ({ children }: { children: ReactNode }) => (
        <div role="menuitem">{children}</div>
    ),
    DropdownMenuSubContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuRadioGroup: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuRadioItem: ({
        children,
        onSelect,
    }: {
        children: ReactNode
        onSelect?: () => void
    }) => (
        <div role="menuitemradio" onClick={onSelect}>
            {children}
        </div>
    ),
}))

function createRowMock<T>(overrides?: Partial<Row<T>>) {
    return {
        // getIsSelected: () => false,
        ...overrides,
    } as unknown as Row<T>
}

function createConfig<T>(overrides?: Partial<DataTableRowActionsConfig<T>>) {
    return {
        schema: {
            parse: vi.fn((data: unknown) => data),
        },
        menuItems: vi.fn(() => []),
        ...overrides,
    } as DataTableRowActionsConfig<T>
}

const renderDataTableRowActions = <T,>(
    configOverrides?: Partial<DataTableRowActionsConfig<T>>,
    rowOverrides?: Partial<Row<T>>
) => {
    const row = createRowMock(rowOverrides)
    const config = createConfig(configOverrides)
    return render(<DataTableRowActions row={row} config={config} />)
}

const openMenu = async () => {
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
}

describe('DataTableRowActions', () => {
    it('renders menu trigger', () => {
        renderDataTableRowActions()

        expect(
            screen.getByRole('button', { name: /open menu/i })
        ).toBeInTheDocument()

        expect(screen.getByTestId('icon-more')).toBeInTheDocument()
    })

    it('renders separator', async () => {
        renderDataTableRowActions({
            menuItems: () => [{ type: 'separator' }],
        })

        await openMenu()

        expect(screen.getByTestId('separator')).toBeInTheDocument()
    })

    it('renders radio group items', async () => {
        renderDataTableRowActions({
            menuItems: () => [
                {
                    type: 'radio-group',
                    label: 'Status',
                    value: 'active',
                    options: [
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                    ],
                },
            ],
        })

        await openMenu()

        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('calls onSelect when radio item is selected', async () => {
        const rowData = { id: 1 }
        const onSelect = vi.fn()

        renderDataTableRowActions(
            {
                menuItems: () => [
                    {
                        type: 'radio-group',
                        label: 'Status',
                        value: 'active',
                        onSelect,
                        options: [{ label: 'Active', value: 'active' }],
                    },
                ],
            },
            { original: rowData }
        )

        await openMenu()
        await userEvent.click(screen.getByText('Active'))

        expect(onSelect).toHaveBeenCalledWith(rowData)
    })

    it('renders action items', async () => {
        renderDataTableRowActions({
            menuItems: () => [{ type: 'action', label: 'Edit' }],
        })

        await openMenu()

        expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('calls onSelect when action is clicked', async () => {
        const onSelect = vi.fn()
        const rowData = { id: 2 }

        renderDataTableRowActions(
            {
                menuItems: () => [{ type: 'action', label: 'Edit', onSelect }],
            },
            { original: rowData }
        )

        await openMenu()
        await userEvent.click(screen.getByText('Edit'))

        expect(onSelect).toHaveBeenCalledWith(rowData)
    })

    it('does not call onSelect when action is disabled', async () => {
        const onSelect = vi.fn()

        renderDataTableRowActions(
            {
                menuItems: () => [
                    { type: 'action', label: 'Edit', onSelect, disabled: true },
                ],
            },
            { original: { id: 3 } }
        )

        await openMenu()
        await userEvent.click(screen.getByText('Edit'))

        expect(onSelect).not.toHaveBeenCalled()
    })

    it('renders shortcut for action item', async () => {
        renderDataTableRowActions({
            menuItems: () => [
                { type: 'action', label: 'Delete', shortcut: '⌘D' },
            ],
        })

        await openMenu()

        expect(screen.getByTestId('shortcut')).toHaveTextContent('⌘D')
    })

    it('renders icon when provided', async () => {
        const Icon = () => <div data-testid="custom-icon" />

        renderDataTableRowActions({
            menuItems: () => [{ type: 'action', label: 'Edit', icon: Icon }],
        })

        await openMenu()

        expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
})
