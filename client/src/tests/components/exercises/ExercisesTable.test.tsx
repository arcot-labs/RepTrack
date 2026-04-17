import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { dash } from '@/lib/text'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import {
    dataTableMock,
    getColumn,
    getDataTableProps,
    hasAccessorFn,
    hasAccessorKey,
    hasFilterFn,
    hasGetUniqueValues,
    renderCell,
    testHeader,
} from '@/tests/components/utils'
import { getMockProps } from '@/tests/utils'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// import last
import { ExercisesTable } from '@/components/exercises/ExercisesTable'

const onExerciseDeletedMock = vi.fn()
const onReloadExercisesMock = vi.fn()
const onReloadMuscleGroupsMock = vi.fn()

const rowLoadingMocks = vi.hoisted(() => ({
    isRowLoading: vi.fn(() => false),
    setRowLoading: vi.fn(),
    useRowLoading: vi.fn(),
}))

const controllerMocks = vi.hoisted(() => ({
    useExercisesTableController: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    menuItems: vi.fn(),
    onExerciseFormOpenChange: vi.fn(),
    onExerciseFormSuccess: vi.fn(),
    onReloadExercises: vi.fn(),
    onReloadMuscleGroups: vi.fn(),
}))

const confirmDialogMock = vi.hoisted(() => vi.fn())
const inlineRowActionsMock = vi.hoisted(() => vi.fn())
const truncatedCellMock = vi.hoisted(() => vi.fn())
const exerciseFormDialogMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/data-table/useRowLoading', () => ({
    useRowLoading: rowLoadingMocks.useRowLoading,
}))

vi.mock('@/components/exercises/useExercisesTableController', () => ({
    useExercisesTableController: controllerMocks.useExercisesTableController,
}))

vi.mock('@/components/ConfirmDialog', () => ({
    ConfirmDialog: (props: unknown) => {
        confirmDialogMock(props)
        const p = props as { children: React.ReactNode }
        return <div data-testid="mock-confirm-dialog">{p.children}</div>
    },
}))

vi.mock('@/components/exercises/ExerciseFormDialog', () => ({
    ExerciseFormDialog: (props: unknown) => {
        exerciseFormDialogMock(props)
        return <div data-testid="mock-exercise-form-dialog" />
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
    formatNullableDateTime: (value?: string | null) =>
        `${String(value)} - formatNullableDateTime`,
}))

vi.mock('@/lib/text', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/text')>('@/lib/text')

    return {
        ...actual,
        capitalizeWords: vi.fn((value: string) => `${value} - capitalized`),
    }
})

const muscleGroup: MuscleGroupPublic = {
    id: 10,
    name: 'quads',
    description: 'Quadriceps muscles',
}

const customExercise: ExercisePublic = {
    id: 1,
    user_id: 2,
    name: 'back squat',
    description: 'Barbell squat',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
    muscle_groups: [muscleGroup],
}

const systemExercise: ExercisePublic = {
    id: 2,
    user_id: null,
    name: 'push up',
    description: null,
    created_at: '2026-04-18T00:00:00Z',
    updated_at: '2026-04-19T00:00:00Z',
    muscle_groups: [],
}

const displayedExercises = [customExercise, systemExercise]

const renderExercisesTable = (
    overrides: Partial<Parameters<typeof ExercisesTable>[0]> = {}
) =>
    render(
        <ExercisesTable
            {...{
                exercises: displayedExercises,
                muscleGroups: [muscleGroup],
                isLoading: false,
                onExerciseDeleted: onExerciseDeletedMock,
                onReloadExercises: onReloadExercisesMock,
                onReloadMuscleGroups: onReloadMuscleGroupsMock,
                ...overrides,
            }}
        />
    )

const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
    schema: {} as DataTableRowActionsConfig<ExercisePublic>['schema'],
    menuItems: controllerMocks.menuItems,
}

const toolbarConfig = {
    search: {
        placeholder: 'Search exercises...',
        value: 'squat',
        onChange: vi.fn(),
        isLoading: false,
    },
    filters: [],
    actions: [],
    showViewOptions: true,
}

const mockControllerState = ({
    isOpen = false,
    isConfirming = false,
    args = [customExercise],
    formDialog = {
        isOpen: false,
        mode: 'create' as 'create' | 'edit' | 'view',
        exercise: null as ExercisePublic | null,
    },
} = {}) => {
    controllerMocks.useExercisesTableController.mockReturnValue({
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
        displayedExercises,
        formDialog,
        onExerciseFormOpenChange: controllerMocks.onExerciseFormOpenChange,
        onExerciseFormSuccess: controllerMocks.onExerciseFormSuccess,
        onReloadExercises: controllerMocks.onReloadExercises,
        onReloadMuscleGroups: controllerMocks.onReloadMuscleGroups,
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
        confirmLabel: string
    }
}

const getFormDialogProps = () => {
    return getMockProps(exerciseFormDialogMock) as {
        open: boolean
        mode: 'create' | 'edit' | 'view'
        exercise: ExercisePublic | null
        muscleGroups: MuscleGroupPublic[]
        isRowLoading: boolean
        onOpenChange: (isOpen: boolean) => void
        onSuccess: () => Promise<void>
        onReloadExercises: () => Promise<void>
        onReloadMuscleGroups: () => Promise<void>
        onRowLoadingChange: (id: number, isLoading: boolean) => void
    }
}

beforeEach(() => {
    vi.clearAllMocks()
    rowLoadingMocks.useRowLoading.mockReturnValue({
        isRowLoading: rowLoadingMocks.isRowLoading,
        setRowLoading: rowLoadingMocks.setRowLoading,
    })
    controllerMocks.menuItems.mockReturnValue([
        {
            type: 'action',
            label: 'View',
            onSelect: vi.fn(),
            disabled: false,
        },
    ])
    mockControllerState()
})

describe('ExercisesTable - columns', () => {
    it('configures actions column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(cols, (c) => c.id === 'actions')

        testHeader(col, 'actions', 'Actions')

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByTestId('mock-inline-row-actions')
        ).toBeInTheDocument()
        expect(inlineRowActionsMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ row: { original: customExercise } })
        )

        const props = getMockProps(inlineRowActionsMock) as {
            row: { original: ExercisePublic }
            config: DataTableRowActionsConfig<ExercisePublic>
        }
        props.config.menuItems(props.row.original)

        expect(controllerMocks.menuItems).toHaveBeenCalledWith(customExercise)

        controllerMocks.menuItems.mockReturnValueOnce([])
        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures name column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'name'
        )

        testHeader(col, 'name', 'Name')

        const cell = renderCell(col, customExercise)
        expect(cell.getByText('back squat - capitalized')).toBeInTheDocument()
        expect(cell.getByTestId('mock-truncated-cell')).toBeInTheDocument()
        expect(truncatedCellMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                value: 'back squat - capitalized',
            })
        )
    })

    it('configures muscle groups column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(cols, (c) => c.id === 'muscle_groups')

        if (!hasAccessorFn(col))
            throw new Error('Muscle groups column does not have an accessorFn')
        expect(col.accessorFn(customExercise, 0)).toBe('quads')

        if (!hasGetUniqueValues(col))
            throw new Error(
                'Muscle groups column does not have getUniqueValues'
            )
        expect(col.getUniqueValues(customExercise)).toEqual(['10'])

        testHeader(col, 'muscle_groups', 'Muscle Groups')

        const customCell = renderCell(col, customExercise)
        expect(customCell.getByText('quads - capitalized')).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()

        if (!hasFilterFn(col))
            throw new Error('Muscle groups column does not have a filterFn')
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', ['10'])
        ).toBe(true)
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', ['99'])
        ).toBe(false)
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', [])
        ).toBe(true)
    })

    it('configures description column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'description'
        )

        testHeader(col, 'description', 'Description')

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByTestId('mock-truncated-cell')
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures created at column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'created_at'
        )

        testHeader(col, 'created_at', 'Created At')

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByText(
                `${customExercise.created_at} - formatNullableDateTime`
            )
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures updated at column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'updated_at'
        )

        testHeader(col, 'updated_at', 'Updated At')

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByText(
                `${customExercise.updated_at} - formatNullableDateTime`
            )
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures virtual type column', () => {
        renderExercisesTable()

        const cols = getDataTableProps<ExercisePublic>().columns
        const col = getColumn(cols, (c) => c.id === 'type')

        if (!hasAccessorFn(col))
            throw new Error('Type column does not have an accessorFn')
        expect(col.accessorFn(systemExercise, 0)).toBe('system')
        expect(col.accessorFn(customExercise, 0)).toBe('custom')

        if (!hasFilterFn(col))
            throw new Error('Type column does not have a filterFn')
        const mockRow = {
            getValue: () => 'custom',
        }
        expect(col.filterFn(mockRow, 'type', ['custom'])).toBe(true)
        expect(col.filterFn(mockRow, 'type', ['system'])).toBe(false)
    })
})

describe('ExercisesTable', () => {
    it('passes props to DataTable', () => {
        renderExercisesTable()

        expect(screen.getByTestId('mock-data-table')).toBeInTheDocument()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = getMockProps(dataTableMock)
        expect(props).toMatchObject({
            data: displayedExercises,
            initialColumnVisibility: { type: false },
            toolbarConfig,
            pageSize: 10,
            isLoading: false,
        })
    })

    it('passes table state to exercises controller', () => {
        renderExercisesTable()

        expect(
            controllerMocks.useExercisesTableController
        ).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                exercises: displayedExercises,
                muscleGroups: [muscleGroup],
                onExerciseDeleted: onExerciseDeletedMock,
                onReloadExercises: onReloadExercisesMock,
                onReloadMuscleGroups: onReloadMuscleGroupsMock,
                isRowLoading: rowLoadingMocks.isRowLoading,
                setRowLoading: rowLoadingMocks.setRowLoading,
            })
        )
    })

    it('passes controller and row loading state to ExerciseFormDialog', () => {
        mockControllerState({
            formDialog: {
                isOpen: true,
                mode: 'edit',
                exercise: customExercise,
            },
        })
        rowLoadingMocks.isRowLoading.mockReturnValueOnce(true)

        renderExercisesTable()

        expect(
            screen.getByTestId('mock-exercise-form-dialog')
        ).toBeInTheDocument()

        const props = getFormDialogProps()
        expect(props).toMatchObject({
            open: true,
            mode: 'edit',
            exercise: customExercise,
            muscleGroups: [muscleGroup],
            isRowLoading: true,
            onOpenChange: controllerMocks.onExerciseFormOpenChange,
            onSuccess: controllerMocks.onExerciseFormSuccess,
            onReloadExercises: controllerMocks.onReloadExercises,
            onReloadMuscleGroups: controllerMocks.onReloadMuscleGroups,
            onRowLoadingChange: rowLoadingMocks.setRowLoading,
        })
        expect(rowLoadingMocks.isRowLoading).toHaveBeenCalledWith(
            customExercise.id
        )
    })

    it('passes false form row loading when no dialog exercise exists', () => {
        renderExercisesTable()

        const props = getFormDialogProps()
        expect(props.isRowLoading).toBe(false)
        expect(rowLoadingMocks.isRowLoading).not.toHaveBeenCalled()
    })
})

describe('ExercisesTable - dialog', () => {
    it('does nothing if onOpenChange called with true', () => {
        renderExercisesTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(true)

        expect(controllerMocks.close).not.toHaveBeenCalled()
    })

    it('does nothing if onOpenChange called when dialog already confirming', () => {
        mockControllerState({
            isOpen: true,
            isConfirming: true,
        })
        renderExercisesTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(controllerMocks.close).not.toHaveBeenCalled()
    })

    it('closes dialog when onOpenChange called with false', () => {
        renderExercisesTable()

        const dialogProps = getDialogProps()
        dialogProps.onOpenChange(false)

        expect(controllerMocks.close).toHaveBeenCalledOnce()
    })

    it('shows correct dialog content', () => {
        mockControllerState({
            isOpen: true,
            args: [customExercise],
        })
        renderExercisesTable()

        const dialogProps = getDialogProps()
        expect(dialogProps.title).toBe('Delete Exercise')
        expect(dialogProps.confirmLabel).toBe('Delete')

        const content = screen.getByTestId('mock-confirm-dialog')
        expect(content).toHaveTextContent(
            'Are you sure you want to delete back squat?'
        )
    })

    it('passes isConfirming and loading label when confirming', () => {
        mockControllerState({
            isOpen: true,
            isConfirming: true,
        })
        renderExercisesTable()

        const dialogProps = getDialogProps()
        expect(dialogProps.isConfirming).toBe(true)
        expect(dialogProps.confirmLabel).toBe('Deleting...')
    })

    it('calls confirm when ConfirmDialog onConfirm invoked', async () => {
        renderExercisesTable()

        const dialogProps = getDialogProps()
        await act(async () => {
            dialogProps.onConfirm()
            await Promise.resolve()
        })

        expect(controllerMocks.confirm).toHaveBeenCalledOnce()
    })

    it('calls close when ConfirmDialog onCancel invoked', async () => {
        renderExercisesTable()

        const dialogProps = getDialogProps()
        await act(async () => {
            dialogProps.onCancel()
            await Promise.resolve()
        })

        expect(controllerMocks.close).toHaveBeenCalledOnce()
    })
})
