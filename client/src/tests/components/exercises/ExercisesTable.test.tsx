import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import { dataTableMock } from '@/tests/components/utils'
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
const exerciseFormDialogMock = vi.hoisted(() => vi.fn())
const columnsMocks = vi.hoisted(() => ({
    getExerciseColumns: vi.fn(),
}))

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

vi.mock('@/components/exercises/ExercisesTableColumns', () => ({
    getExerciseColumns: columnsMocks.getExerciseColumns,
}))

vi.mock('@/components/exercises/ExerciseFormDialog', () => ({
    ExerciseFormDialog: (props: unknown) => {
        exerciseFormDialogMock(props)
        return <div data-testid="mock-exercise-form-dialog" />
    },
}))

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

const columns = [{ id: 'name' }, { id: 'actions' }]

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
    columnsMocks.getExerciseColumns.mockReturnValue(columns)
    mockControllerState()
})

describe('ExercisesTable', () => {
    it('passes props to DataTable', () => {
        renderExercisesTable()

        expect(screen.getByTestId('mock-data-table')).toBeInTheDocument()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = getMockProps(dataTableMock)
        expect(props).toMatchObject({
            data: displayedExercises,
            columns,
            initialColumnVisibility: { type: false },
            toolbarConfig,
            pageSize: 10,
            isLoading: false,
        })
        expect(columnsMocks.getExerciseColumns).toHaveBeenCalledExactlyOnceWith(
            rowActionsConfig
        )
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
