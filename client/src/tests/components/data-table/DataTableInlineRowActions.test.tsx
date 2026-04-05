import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import type { Row } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { buttonMock } = vi.hoisted(() => ({
    buttonMock: vi.fn(
        ({
            children,
            onClick,
            disabled,
        }: {
            children: ReactNode
            onClick?: () => void
            disabled?: boolean
        }) => (
            <button disabled={disabled} onClick={onClick}>
                {children}
            </button>
        )
    ),
}))

vi.mock('@/components/ui/overrides/button', () => ({
    Button: buttonMock,
}))

function createConfig<T>(overrides?: Partial<DataTableRowActionsConfig<T>>) {
    return {
        schema: {
            parse: vi.fn((data: unknown) => data),
        },
        menuItems: vi.fn(() => []),
        ...overrides,
    } as DataTableRowActionsConfig<T>
}

function createRowMock<T>(overrides?: Partial<Row<T>>) {
    return {
        getIsSelected: () => false,
        ...overrides,
    } as unknown as Row<T>
}

const renderDataTableInlineRowActions = <T,>(
    configOverrides?: Partial<DataTableRowActionsConfig<T>>,
    rowOverrides?: Partial<Row<T>>
) => {
    const row = createRowMock(rowOverrides)
    const config = createConfig(configOverrides)
    return render(<DataTableInlineRowActions row={row} config={config} />)
}

describe('DataTableInlineRowActions', () => {
    it('renders buttons for each menu item', () => {
        renderDataTableInlineRowActions({
            menuItems: () => [
                { type: 'action', label: 'Edit' },
                { type: 'action', label: 'Delete' },
            ],
        })

        expect(screen.getByText('Edit')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('parses row data using schema', () => {
        const parse = vi.fn((data: unknown) => data)
        const config = { schema: { parse } as never }
        const rowData = { id: 1 }

        renderDataTableInlineRowActions(config, { original: rowData })

        expect(parse).toHaveBeenCalledWith(rowData)
    })

    it('passes parsed data to menuItems', () => {
        const parsed = { id: 1 }
        const parse = vi.fn(() => parsed)
        const menuItems = vi.fn(() => [])

        const config = {
            schema: { parse } as never,
            menuItems,
        }

        renderDataTableInlineRowActions(config, { original: { id: 1 } })

        expect(menuItems).toHaveBeenCalledWith(parsed)
    })

    it('calls onSelect with parsed row data when clicked', async () => {
        const parsed = { id: 1 }
        const onSelect = vi.fn()

        const config = {
            schema: { parse: () => parsed } as never,
            menuItems: () => [
                { type: 'action', label: 'Edit', onSelect } as never,
            ],
        }

        renderDataTableInlineRowActions(config)

        await userEvent.click(screen.getByText('Edit'))

        expect(onSelect).toHaveBeenCalledWith(parsed)
    })

    it('disables button when item is disabled', () => {
        const config = {
            menuItems: () => [
                { type: 'action', label: 'Edit', disabled: true } as never,
            ],
        }

        renderDataTableInlineRowActions(config)

        expect(screen.getByText('Edit')).toBeDisabled()
    })

    it('renders icon when provided', () => {
        const Icon = () => <div data-testid="icon" />

        const config = {
            menuItems: () => [
                { type: 'action', label: 'Edit', icon: Icon } as never,
            ],
        }

        renderDataTableInlineRowActions(config)

        expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('throws error for separator item', () => {
        const config = {
            menuItems: () => [{ type: 'separator' } as never],
        }

        expect(() => renderDataTableInlineRowActions(config)).toThrow()
    })

    it('throws error for radio-group item', () => {
        const config = {
            menuItems: () => [{ type: 'radio-group' } as never],
        }

        expect(() => renderDataTableInlineRowActions(config)).toThrow()
    })
})
