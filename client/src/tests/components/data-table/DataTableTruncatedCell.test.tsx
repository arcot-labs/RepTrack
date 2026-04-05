import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createContext, useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

interface TooltipContextValue {
    open: boolean
    setOpen: (open: boolean) => void
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

vi.mock('@/components/ui/overrides/tooltip', () => ({
    Tooltip: ({ children }: { children: ReactNode }) => {
        // always open for testing
        const [open, setOpen] = useState(true)
        return (
            <TooltipContext.Provider value={{ open, setOpen }}>
                <div>{children}</div>
            </TooltipContext.Provider>
        )
    },
    TooltipTrigger: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    TooltipContent: ({ children }: { children: ReactNode }) => (
        <div data-testid="tooltip">{children}</div>
    ),
}))

const renderTruncatedCell = (value: string, className?: string) => {
    return render(
        <DataTableTruncatedCell value={value} className={className} />
    )
}

describe('DataTableTruncatedCell', () => {
    it('renders cell value', () => {
        renderTruncatedCell('Hello world')

        expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('does not show tooltip when text is not truncated', async () => {
        renderTruncatedCell('Hello world')

        const text = screen.getByText('Hello world')

        Object.defineProperty(text, 'offsetWidth', { value: 100 })
        Object.defineProperty(text, 'scrollWidth', { value: 100 })

        await userEvent.hover(text)

        expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    })

    it('shows tooltip when text is truncated', async () => {
        renderTruncatedCell('Hello world')

        const text = screen.getByText('Hello world')

        Object.defineProperty(text, 'offsetWidth', { value: 50 })
        Object.defineProperty(text, 'scrollWidth', { value: 100 })

        await userEvent.hover(text)

        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toHaveTextContent('Hello world')
    })

    it('checks truncation on focus', () => {
        renderTruncatedCell('Hello world')

        const text = screen.getByText('Hello world')

        Object.defineProperty(text, 'offsetWidth', { value: 50 })
        Object.defineProperty(text, 'scrollWidth', { value: 100 })

        fireEvent.focus(text)

        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('applies custom className', () => {
        renderTruncatedCell('Hello', 'max-w-48')

        const text = screen.getByText('Hello')

        expect(text).toHaveClass('truncate')
        expect(text).toHaveClass('max-w-48')
    })
})
