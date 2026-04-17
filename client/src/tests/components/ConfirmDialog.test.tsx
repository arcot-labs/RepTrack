import { ConfirmDialog } from '@/components/ConfirmDialog'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const dialogMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/ui/dialog', () => ({
    Dialog: (props: unknown) => {
        dialogMock(props)
        const p = props as { children: React.ReactNode }
        return <div data-testid="mock-dialog">{p.children}</div>
    },
    DialogContent: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-dialog-content">{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}))

describe('ConfirmDialog', () => {
    it('renders title and content', () => {
        render(
            <ConfirmDialog
                open={true}
                isConfirming={false}
                title="Delete Workout"
                confirmLabel="Delete"
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
                onOpenChange={vi.fn()}
            >
                Are you sure?
            </ConfirmDialog>
        )

        expect(screen.getByText('Delete Workout')).toBeInTheDocument()
        expect(screen.getByTestId('mock-dialog-content')).toHaveTextContent(
            'Are you sure?'
        )
    })

    it('calls handlers on button clicks', async () => {
        const onCancel = vi.fn()
        const onConfirm = vi.fn()

        render(
            <ConfirmDialog
                open={true}
                isConfirming={false}
                title="Delete"
                confirmLabel="Confirm"
                onConfirm={onConfirm}
                onCancel={onCancel}
                onOpenChange={vi.fn()}
            >
                Content
            </ConfirmDialog>
        )

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

        expect(onCancel).toHaveBeenCalledOnce()
        expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('disables buttons when confirming', () => {
        render(
            <ConfirmDialog
                open={true}
                isConfirming={true}
                title="Delete"
                confirmLabel="Deleting..."
                onConfirm={vi.fn()}
                onCancel={vi.fn()}
                onOpenChange={vi.fn()}
            >
                Content
            </ConfirmDialog>
        )

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
        expect(
            screen.getByRole('button', { name: 'Deleting...' })
        ).toBeDisabled()
    })
})
