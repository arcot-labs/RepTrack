import { createSelectColumn } from '@/components/data-table/DataTableSelectColumn'
import type { Row, Table } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const { checkboxMock } = vi.hoisted(() => ({
    checkboxMock: vi.fn(
        ({
            checked,
            onCheckedChange,
            'aria-label': ariaLabel,
        }: {
            checked?: boolean | 'indeterminate'
            onCheckedChange?: (value: boolean) => void
            'aria-label'?: string
        }) => (
            <button
                role="checkbox"
                aria-label={ariaLabel}
                data-checked={checked}
                onClick={() => onCheckedChange?.(true)}
            />
        )
    ),
}))

vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: checkboxMock,
}))

function createRowMock(overrides?: Partial<Row<unknown>>) {
    return {
        getIsSelected: () => false,
        ...overrides,
    }
}

function createTableMock(overrides?: Partial<Table<unknown>>) {
    return {
        getIsAllPageRowsSelected: () => false,
        getIsSomePageRowsSelected: () => false,
        ...overrides,
    }
}

const renderSelectColumnHeader = (tableOverrides?: Partial<Table<unknown>>) => {
    const column = createSelectColumn()
    /* eslint-disable */
    // @ts-expect-error - override type mismatch
    return render(column.header!({ table: createTableMock(tableOverrides) }))
    /* eslint-enable */
}

const renderSelectColumnCell = (rowOverrides?: Partial<Row<unknown>>) => {
    const column = createSelectColumn()
    /* eslint-disable */
    // @ts-expect-error - override type mismatch
    return render(column.cell!({ row: createRowMock(rowOverrides) }))
    /* eslint-enable */
}

describe('DataTableSelectColumn', () => {
    it('renders header checkbox', () => {
        renderSelectColumnHeader()

        expect(
            screen.getByRole('checkbox', { name: /select all/i })
        ).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'data-checked',
            'false'
        )
    })

    it('sets header checkbox checked when all rows are selected', () => {
        renderSelectColumnHeader({
            getIsAllPageRowsSelected: () => true,
        })

        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'data-checked',
            'true'
        )
    })

    it('sets header checkbox to indeterminate when some rows are selected', () => {
        renderSelectColumnHeader({
            getIsSomePageRowsSelected: () => true,
        })

        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'data-checked',
            'indeterminate'
        )
    })

    it('toggles all rows when header checkbox is clicked', async () => {
        const toggleAll = vi.fn()

        renderSelectColumnHeader({
            toggleAllPageRowsSelected: toggleAll,
        })

        await userEvent.click(screen.getByRole('checkbox'))

        expect(toggleAll).toHaveBeenCalledWith(true)
    })

    it('renders row checkbox', () => {
        // render(column.cell!({ row: createRowMock() } as any))
        renderSelectColumnCell()

        expect(
            screen.getByRole('checkbox', { name: /select row/i })
        ).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'data-checked',
            'false'
        )
    })

    it('sets row checkbox checked when row is selected', () => {
        renderSelectColumnCell({
            getIsSelected: () => true,
        })

        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'data-checked',
            'true'
        )
    })

    it('toggles row selection when clicked', async () => {
        const toggleSelected = vi.fn()
        renderSelectColumnCell({
            toggleSelected,
        })

        await userEvent.click(screen.getByRole('checkbox'))

        expect(toggleSelected).toHaveBeenCalledWith(true)
    })
})
