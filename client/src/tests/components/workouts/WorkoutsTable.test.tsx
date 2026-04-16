import type { WorkoutBase } from '@/api/generated'
import { getWorkoutRowActions, handleDelete } from '@/components/workouts/utils'
import { dash } from '@/lib/text'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import {
    dataTableMock,
    getColumn,
    getDataTableProps,
    hasAccessorKey,
    renderCell,
    testHeader,
} from '@/tests/components/utils'
import { getMockProps } from '@/tests/utils'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// import last
import { WorkoutsTable } from '@/components/workouts/WorkoutsTable'

const onWorkoutDeletedMock = vi.fn()
const onReloadWorkoutsMock = vi.fn()

const dialogMocks = vi.hoisted(() => ({
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    useDialog: vi.fn(),
}))

const dialogMock = vi.hoisted(() => vi.fn())
const inlineRowActionsMock = vi.hoisted(() => vi.fn())
const truncatedCellMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth/session', () => ({
    useSession: () => ({
        user: {
            id: 1,
            username: 'test-user',
        },
    }),
}))

vi.mock('@/components/workouts/utils', () => ({
    handleDelete: vi.fn(),
    getWorkoutRowActions: vi.fn(),
    getWorkoutToolbarActions: vi.fn(),
}))

vi.mock('@/components/dialog', () => ({
    useDialog: dialogMocks.useDialog,
}))

vi.mock('@/components/data-table/DataTableInlineRowActions', () => ({
    DataTableInlineRowActions: (props: unknown) => {
        inlineRowActionsMock(props)
        return <div data-testid="mock-inline-row-actions" />
    },
}))

vi.mock('@/components/data-table/DataTableTruncatedCell', () => ({
    DataTableTruncatedCell: (props: unknown) => {
        truncatedCellMock(props)
        return <div data-testid="mock-truncated-cell" />
    },
}))

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

vi.mock('@/lib/datetime', () => ({
    formatDateTime: (value: string) => `${value} - formatDateTime`,
    formatNullableDateTime: (value?: string | null) =>
        `${String(value)} - formatNullableDateTime`,
}))

const workout: WorkoutBase = {
    id: 1,
    user_id: 2,
    started_at: '2026-04-15T00:00:00Z',
    ended_at: null,
    notes: null,
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
}

const renderWorkoutsTable = (
    overrides: Partial<Parameters<typeof WorkoutsTable>[0]> = {}
) =>
    render(
        <WorkoutsTable
            {...{
                workouts: [workout],
                isLoading: false,
                onWorkoutDeleted: onWorkoutDeletedMock,
                onReloadWorkouts: onReloadWorkoutsMock,
                ...overrides,
            }}
        />
    )

const mockDialogState = ({
    isOpen = false,
    isConfirming = false,
    args = [workout.id],
} = {}) => {
    dialogMocks.useDialog.mockReturnValue({
        state: {
            isOpen,
            isConfirming,
            args,
        },
        open: dialogMocks.open,
        close: dialogMocks.close,
        confirm: dialogMocks.confirm,
    })
}

const getDialogProps = () => {
    return getMockProps(dialogMock) as {
        onOpenChange: (isOpen: boolean) => void
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getWorkoutRowActions).mockReturnValue([
        {
            type: 'action',
            label: 'Open',
            onSelect: vi.fn(),
            disabled: false,
        },
    ])
    mockDialogState()
})

describe('WorkoutsTable - columns', () => {
    it('configures actions column', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(cols, (c) => c.id === 'actions')

        testHeader(col, 'actions', 'Actions')

        const cell = renderCell(col, workout)
        expect(cell.getByTestId('mock-inline-row-actions')).toBeInTheDocument()
        expect(inlineRowActionsMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                row: { original: workout },
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                config: expect.objectContaining({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    schema: expect.any(Object),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    menuItems: expect.any(Function),
                }),
            })
        )

        const props = getMockProps(inlineRowActionsMock) as {
            row: { original: WorkoutBase }
            config: DataTableRowActionsConfig<WorkoutBase>
        }
        // invoke manually
        props.config.menuItems(props.row.original)

        expect(getWorkoutRowActions).toHaveBeenCalledExactlyOnceWith(
            workout.id,
            false,
            dialogMocks.open
        )
    })

    it('configures started at column', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'started_at'
        )

        testHeader(col, 'started_at', 'Started At')

        const { getByText } = renderCell(col, workout)
        const expected = `${workout.started_at} - formatDateTime`
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures ended at column', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'ended_at'
        )

        testHeader(col, 'ended_at', 'Ended At')

        const { getByText } = renderCell(col, workout)
        const expected = `${String(workout.ended_at)} - formatNullableDateTime`
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures notes column for null value', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'notes'
        )

        testHeader(col, 'notes', 'Notes')

        const { getByText } = renderCell(col, workout)
        const expected = dash
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures notes column for non-null value', () => {
        const workoutWithNotes = { ...workout, notes: 'Some notes' }
        renderWorkoutsTable({ workouts: [workoutWithNotes] })

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'notes'
        )

        testHeader(col, 'notes', 'Notes')

        const cell = renderCell(col, workoutWithNotes)
        expect(cell.getByTestId('mock-truncated-cell')).toBeInTheDocument()
        expect(truncatedCellMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                value: workoutWithNotes.notes,
            })
        )
    })

    it('configures created at column', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'created_at'
        )

        testHeader(col, 'created_at', 'Created At')

        const { getByText } = renderCell(col, workout)
        const expected = `${workout.created_at} - formatDateTime`
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures updated at column', () => {
        renderWorkoutsTable()

        const cols = getDataTableProps<WorkoutBase>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'updated_at'
        )

        testHeader(col, 'updated_at', 'Updated At')

        const { getByText } = renderCell(col, workout)
        const expected = `${workout.updated_at} - formatDateTime`
        expect(getByText(expected)).toBeInTheDocument()
    })
})

describe('WorkoutsTable', () => {
    it('passes props to DataTable', () => {
        renderWorkoutsTable()

        expect(screen.getByTestId('mock-data-table')).toBeInTheDocument()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = getMockProps(dataTableMock)
        expect(props).toMatchObject({
            data: [workout],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            columns: expect.any(Array),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            toolbarConfig: expect.any(Object),
            pageSize: 10,
            isLoading: false,
        })
    })
})

describe('WorkoutsTable - dialog', () => {
    it('calls handleDelete in callback', async () => {
        renderWorkoutsTable()

        expect(screen.getByTestId('mock-dialog')).toBeInTheDocument()

        expect(dialogMocks.useDialog).toHaveBeenCalledOnce()

        const onConfirm = getMockProps(dialogMocks.useDialog)
        expect(onConfirm).toBeTypeOf('function')

        await act(async () => {
            // @ts-expect-error onConfirm is typed correctly
            onConfirm(workout.id)
            await Promise.resolve()
        })

        expect(handleDelete).toHaveBeenCalledExactlyOnceWith(
            workout.id,
            onWorkoutDeletedMock,
            onReloadWorkoutsMock,
            expect.any(Function)
        )
    })

    it('does nothing if onOpenChange called with true', () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(true)

        expect(dialogMocks.close).not.toHaveBeenCalled()
    })

    it('does nothing if onOpenChange called when dialog already confirming', () => {
        mockDialogState({
            isOpen: true,
            isConfirming: true,
        })
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(dialogMocks.close).not.toHaveBeenCalled()
    })

    it('closes dialog when onOpenChange called with false', () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(dialogMocks.close).toHaveBeenCalledOnce()
    })

    it('shows correct dialog content', () => {
        mockDialogState({
            isOpen: true,
        })
        renderWorkoutsTable()

        expect(screen.getByText('Delete Workout')).toBeInTheDocument()
        const content = screen.getByTestId('mock-dialog-content')
        expect(content).toHaveTextContent(
            'Are you sure you want to delete this workout?'
        )
    })

    it('disables buttons when dialog is confirming', () => {
        mockDialogState({
            isOpen: true,
            isConfirming: true,
        })
        renderWorkoutsTable()

        const cancelButton = screen.getByText('Cancel')
        const deletingButton = screen.getByText('Deleting...')

        expect(cancelButton).toBeDisabled()
        expect(deletingButton).toBeDisabled()
    })

    it('calls confirm when button clicked', async () => {
        renderWorkoutsTable()

        const button = screen.getByText('Delete')
        await userEvent.click(button)

        expect(dialogMocks.confirm).toHaveBeenCalledOnce()
    })
})
