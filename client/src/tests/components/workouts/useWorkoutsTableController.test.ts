import type { WorkoutBase } from '@/api/generated'
import { useWorkoutsTableController } from '@/components/workouts/useWorkoutsTableController'
import {
    getWorkoutRowActions,
    getWorkoutToolbarActions,
    handleDeleteWorkout,
} from '@/components/workouts/utils'
import { getMockProps } from '@/tests/utils'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dialogMocks = vi.hoisted(() => ({
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    useDialog: vi.fn(),
}))

vi.mock('@/components/useDialog', () => ({
    useDialog: dialogMocks.useDialog,
}))

vi.mock('@/components/workouts/utils', () => ({
    handleDeleteWorkout: vi.fn(),
    getWorkoutRowActions: vi.fn(),
    getWorkoutToolbarActions: vi.fn(),
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

const onWorkoutDeletedMock = vi.fn()
const onReloadWorkoutsMock = vi.fn()
const setRowLoadingMock = vi.fn()
const isRowLoadingMock = vi.fn(() => false)

const renderUseWorkoutsTableController = () =>
    renderHook(() =>
        useWorkoutsTableController({
            isRowLoading: isRowLoadingMock,
            onReloadWorkouts: onReloadWorkoutsMock,
            onWorkoutDeleted: onWorkoutDeletedMock,
            setRowLoading: setRowLoadingMock,
        })
    )

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
    vi.mocked(getWorkoutToolbarActions).mockReturnValue([
        {
            label: 'Add Workout',
            onClick: vi.fn(),
        },
    ])
    dialogMocks.useDialog.mockReturnValue({
        state: {
            isOpen: false,
            isConfirming: false,
            args: [workout.id],
        },
        open: dialogMocks.open,
        close: dialogMocks.close,
        confirm: dialogMocks.confirm,
    })
})

describe('useWorkoutsTableController', () => {
    it('builds row actions config from row loading and delete dialog', () => {
        const { result } = renderUseWorkoutsTableController()

        const menuItems = result.current.rowActionsConfig.menuItems(workout)

        expect(menuItems).toHaveLength(1)
        expect(isRowLoadingMock).toHaveBeenCalledExactlyOnceWith(workout.id)
        expect(getWorkoutRowActions).toHaveBeenCalledExactlyOnceWith(
            workout.id,
            false,
            dialogMocks.open
        )
    })

    it('builds toolbar config from workout toolbar actions', () => {
        const { result } = renderUseWorkoutsTableController()

        expect(result.current.toolbarConfig).toMatchObject({
            search: {
                columnId: 'notes',
                placeholder: 'Filter by notes...',
            },
            actions: getWorkoutToolbarActions(),
            showViewOptions: true,
        })
    })

    it('wires delete dialog confirm callback to handleDelete', async () => {
        renderUseWorkoutsTableController()

        expect(dialogMocks.useDialog).toHaveBeenCalledOnce()

        const onConfirm = getMockProps(dialogMocks.useDialog)
        expect(onConfirm).toBeTypeOf('function')

        await act(async () => {
            // @ts-expect-error onConfirm is typed correctly
            onConfirm(workout.id)
            await Promise.resolve()
        })

        expect(handleDeleteWorkout).toHaveBeenCalledExactlyOnceWith(
            workout.id,
            onWorkoutDeletedMock,
            onReloadWorkoutsMock,
            setRowLoadingMock
        )
    })

    it('returns delete dialog controller from useDialog', () => {
        const { result } = renderUseWorkoutsTableController()

        expect(result.current.deleteDialog).toMatchObject({
            state: {
                isOpen: false,
                isConfirming: false,
                args: [workout.id],
            },
            open: dialogMocks.open,
            close: dialogMocks.close,
            confirm: dialogMocks.confirm,
        })
    })
})
