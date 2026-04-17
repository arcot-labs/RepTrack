import type { WorkoutBase } from '@/api/generated'
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
import { beforeEach, describe, expect, it, vi } from 'vitest'

// import last
import { WorkoutsTable } from '@/components/workouts/WorkoutsTable'

const onWorkoutDeletedMock = vi.fn()
const onReloadWorkoutsMock = vi.fn()

const controllerMocks = vi.hoisted(() => ({
    useWorkoutsTableController: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    menuItems: vi.fn(),
}))

const confirmDialogMock = vi.hoisted(() => vi.fn())
const inlineRowActionsMock = vi.hoisted(() => vi.fn())
const truncatedCellMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/workouts/useWorkoutsTableController', () => ({
    useWorkoutsTableController: controllerMocks.useWorkoutsTableController,
}))

vi.mock('@/components/ConfirmDialog', () => ({
    ConfirmDialog: (props: unknown) => {
        confirmDialogMock(props)
        const p = props as { children: React.ReactNode }
        return <div data-testid="mock-confirm-dialog">{p.children}</div>
    },
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

const rowActionsConfig: DataTableRowActionsConfig<WorkoutBase> = {
    schema: {} as DataTableRowActionsConfig<WorkoutBase>['schema'],
    menuItems: controllerMocks.menuItems,
}

const toolbarConfig = {
    search: {
        columnId: 'notes',
        placeholder: 'Filter by notes...',
    },
    actions: [],
    showViewOptions: true,
}

const mockControllerState = ({
    isOpen = false,
    isConfirming = false,
    args = [workout.id],
} = {}) => {
    controllerMocks.useWorkoutsTableController.mockReturnValue({
        deleteDialog: {
            state: {
                isOpen,
                isConfirming,
                args,
            },
            open: controllerMocks.open,
            close: controllerMocks.close,
            confirm: controllerMocks.confirm,
        },
        rowActionsConfig,
        toolbarConfig,
    })
}

const getDialogProps = () => {
    return getMockProps(confirmDialogMock) as {
        onOpenChange: (isOpen: boolean) => void
        onConfirm: () => void
        onCancel: () => void
        title: string
        isConfirming: boolean
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    controllerMocks.menuItems.mockReturnValue([
        {
            type: 'action',
            label: 'Open',
            onSelect: vi.fn(),
            disabled: false,
        },
    ])
    mockControllerState()
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

        expect(controllerMocks.menuItems).toHaveBeenCalledExactlyOnceWith(
            workout
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
            toolbarConfig,
            pageSize: 10,
            isLoading: false,
        })
    })

    it('passes table state to workouts controller', () => {
        renderWorkoutsTable()

        expect(
            controllerMocks.useWorkoutsTableController
        ).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                isRowLoading: expect.any(Function),
                onReloadWorkouts: onReloadWorkoutsMock,
                onWorkoutDeleted: onWorkoutDeletedMock,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                setRowLoading: expect.any(Function),
            })
        )
    })
})

describe('WorkoutsTable - dialog', () => {
    it('does nothing if onOpenChange called with true', () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(true)

        expect(controllerMocks.close).not.toHaveBeenCalled()
    })

    it('does nothing if onOpenChange called when dialog already confirming', () => {
        mockControllerState({
            isOpen: true,
            isConfirming: true,
        })
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(controllerMocks.close).not.toHaveBeenCalled()
    })

    it('closes dialog when onOpenChange called with false', () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(controllerMocks.close).toHaveBeenCalledOnce()
    })

    it('shows correct dialog content', () => {
        mockControllerState({
            isOpen: true,
        })
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        expect(dialogProps.title).toBe('Delete Workout')

        const content = screen.getByTestId('mock-confirm-dialog')
        expect(content).toHaveTextContent(
            'Are you sure you want to delete this workout?'
        )
    })

    it('passes isConfirming when confirming', () => {
        mockControllerState({
            isOpen: true,
            isConfirming: true,
        })
        renderWorkoutsTable()

        const dialogProps = getDialogProps()

        expect(dialogProps.isConfirming).toBe(true)
    })

    it('calls confirm when ConfirmDialog onConfirm invoked', async () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        await act(async () => {
            dialogProps.onConfirm()
            await Promise.resolve()
        })

        expect(controllerMocks.confirm).toHaveBeenCalledOnce()
    })

    it('calls close when ConfirmDialog onCancel invoked', async () => {
        renderWorkoutsTable()

        const dialogProps = getDialogProps()
        await act(async () => {
            dialogProps.onCancel()
            await Promise.resolve()
        })

        expect(controllerMocks.close).toHaveBeenCalledOnce()
    })
})
