import { WorkoutService, type WorkoutBase } from '@/api/generated'
import {
    getWorkoutRowActions,
    getWorkoutToolbarActions,
    handleDeleteWorkout,
} from '@/components/workouts/utils'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { ArrowUpRight, Plus, Trash } from 'lucide-react'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    debug: vi.fn(),
    warn: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('@/api/generated', () => ({
    WorkoutService: {
        deleteWorkout: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockWorkout: WorkoutBase = {
    id: 1,
    user_id: 2,
    started_at: '2026-04-15T00:00:00Z',
    ended_at: null,
    notes: null,
    created_at: '2026-04-15T00:00:00Z',
    updated_at: '2026-04-15T00:00:00Z',
}

const callHandleDelete = async (
    payload: { error: unknown } = { error: undefined },
    workoutId: number = mockWorkout.id
) => {
    vi.mocked(WorkoutService).deleteWorkout.mockReturnValue(
        Promise.resolve(payload) as never
    )

    const onWorkoutDeleted = vi.fn()
    const onReloadWorkouts = vi.fn()
    const setRowLoading = vi.fn()

    await handleDeleteWorkout(
        workoutId,
        onWorkoutDeleted,
        onReloadWorkouts,
        setRowLoading
    )
    return { onWorkoutDeleted, onReloadWorkouts, setRowLoading }
}

describe('handleDeleteWorkout', () => {
    let successSpy: MockInstance<typeof notify.success>
    let errorSpy: MockInstance<typeof notify.error>

    beforeEach(() => {
        successSpy = vi.spyOn(notify, 'success').mockImplementation(vi.fn())
        errorSpy = vi.spyOn(notify, 'error').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('calls service with correct path', async () => {
        await callHandleDelete()

        expect(
            vi.mocked(WorkoutService).deleteWorkout
        ).toHaveBeenCalledExactlyOnceWith({
            path: { workout_id: mockWorkout.id },
        })
    })

    it('handles success', async () => {
        const { onWorkoutDeleted, onReloadWorkouts, setRowLoading } =
            await callHandleDelete()

        expect(successSpy).toHaveBeenCalledExactlyOnceWith('Workout deleted')
        expect(onWorkoutDeleted).toHaveBeenCalledExactlyOnceWith(mockWorkout.id)
        expect(onReloadWorkouts).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles error', async () => {
        vi.mocked(handleApiError).mockResolvedValue(undefined)

        const mockError = { code: 'SOME_ERROR', detail: 'error' }
        const { onWorkoutDeleted, onReloadWorkouts, setRowLoading } =
            await callHandleDelete({ error: mockError })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to delete workout',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                httpErrorHandlers: expect.objectContaining({}),
            })
        )
        expect(successSpy).not.toHaveBeenCalled()
        expect(onWorkoutDeleted).not.toHaveBeenCalled()
        expect(onReloadWorkouts).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles workout_not_found error', async () => {
        vi.mocked(handleApiError).mockImplementationOnce(
            async (error, options) => {
                await options.httpErrorHandlers?.workout_not_found?.(
                    error as never
                )
            }
        )

        const mockError = {
            code: 'workout_not_found',
            detail: 'Workout does not exist',
        }
        const { onWorkoutDeleted, onReloadWorkouts, setRowLoading } =
            await callHandleDelete({ error: mockError })

        expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
            'Workout not found. Reloading data'
        )
        expect(onWorkoutDeleted).not.toHaveBeenCalled()
        expect(onReloadWorkouts).toHaveBeenCalledOnce()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })
})

describe('getWorkoutRowActions', () => {
    let warningSpy: MockInstance<typeof notify.warning>

    beforeEach(() => {
        warningSpy = vi.spyOn(notify, 'warning').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('returns items', () => {
        const items = getWorkoutRowActions(mockWorkout.id, false, vi.fn())
        expect(items).toHaveLength(2)

        const [open, _delete] = items
        expect(open).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: ArrowUpRight,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
        expect(_delete).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: Trash,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
    })

    it('disables items when row is loading', () => {
        const items = getWorkoutRowActions(mockWorkout.id, true, vi.fn())
        expect(items[0]?.disabled).toBe(true)
        expect(items[1]?.disabled).toBe(true)
    })

    it('calls notify.warning on open', async () => {
        const items = getWorkoutRowActions(mockWorkout.id, false, vi.fn())

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(warningSpy).toHaveBeenCalledExactlyOnceWith(
            'Not yet implemented'
        )
    })

    it('calls openDeleteDialog on delete', async () => {
        const openDeleteDialog = vi.fn()
        const items = getWorkoutRowActions(
            mockWorkout.id,
            false,
            openDeleteDialog
        )
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openDeleteDialog).toHaveBeenCalledExactlyOnceWith(mockWorkout.id)
    })
})

describe('getWorkoutToolbarActions', () => {
    let warningSpy: MockInstance<typeof notify.warning>

    beforeEach(() => {
        warningSpy = vi.spyOn(notify, 'warning').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('returns items', () => {
        const items = getWorkoutToolbarActions()
        expect(items).toHaveLength(1)

        expect(items[0]).toEqual(
            expect.objectContaining({
                label: 'Add Workout',
                icon: Plus,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onClick: expect.any(Function),
            })
        )
    })

    it('calls notify.warning on add', async () => {
        const items = getWorkoutToolbarActions()

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onClick()

        expect(warningSpy).toHaveBeenCalledExactlyOnceWith(
            'Not yet implemented'
        )
    })
})
