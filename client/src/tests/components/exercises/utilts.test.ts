import { ExerciseService, type ExercisePublic } from '@/api/generated'
import {
    getExerciseRowActions,
    handleDeleteExercise,
} from '@/components/exercises/utils'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { blueText, redText } from '@/lib/styles'
import { Copy, Eye, Pencil, Trash } from 'lucide-react'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('@/api/generated', () => ({
    ExerciseService: {
        deleteExercise: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockExerciseId = 1

const mockExercise: ExercisePublic = {
    id: mockExerciseId,
    user_id: 42,
    name: 'Back Squat',
    description: 'Barbell squat',
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
    muscle_groups: [],
}

const callHandleDelete = async (
    payload: { error: unknown } = { error: undefined },
    exerciseId: number = mockExerciseId
) => {
    vi.mocked(ExerciseService).deleteExercise.mockReturnValue(
        Promise.resolve(payload) as never
    )

    const onExerciseDeleted = vi.fn()
    const refreshSearchResults = vi.fn()
    const onReloadExercises = vi.fn().mockResolvedValue(undefined)
    const setRowLoading = vi.fn()

    await handleDeleteExercise(
        exerciseId,
        onExerciseDeleted,
        refreshSearchResults,
        onReloadExercises,
        setRowLoading
    )

    return {
        onExerciseDeleted,
        refreshSearchResults,
        onReloadExercises,
        setRowLoading,
    }
}

describe('handleDeleteExercise', () => {
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
            vi.mocked(ExerciseService).deleteExercise
        ).toHaveBeenCalledExactlyOnceWith({
            path: { exercise_id: mockExerciseId },
        })
    })

    it('handles success', async () => {
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete()

        expect(successSpy).toHaveBeenCalledExactlyOnceWith('Exercise deleted')
        expect(onExerciseDeleted).toHaveBeenCalledExactlyOnceWith(
            mockExerciseId
        )
        expect(refreshSearchResults).toHaveBeenCalledOnce()
        expect(onReloadExercises).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles error', async () => {
        vi.mocked(handleApiError).mockResolvedValue(undefined)

        const mockError = { code: 'SOME_ERROR', detail: 'error' }
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete({ error: mockError })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to delete exercise',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                httpErrorHandlers: expect.objectContaining({}),
            })
        )
        expect(successSpy).not.toHaveBeenCalled()
        expect(onExerciseDeleted).not.toHaveBeenCalled()
        expect(refreshSearchResults).not.toHaveBeenCalled()
        expect(onReloadExercises).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles exercise_not_found error', async () => {
        vi.mocked(handleApiError).mockImplementationOnce(
            async (error, options) => {
                await options.httpErrorHandlers?.exercise_not_found?.(
                    error as never
                )
            }
        )

        const mockError = {
            code: 'exercise_not_found',
            detail: 'Exercise does not exist',
        }
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete({ error: mockError })

        expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
            'Exercise not found. Reloading data'
        )
        expect(onExerciseDeleted).not.toHaveBeenCalled()
        expect(refreshSearchResults).not.toHaveBeenCalled()
        expect(onReloadExercises).toHaveBeenCalledOnce()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })
})

describe('getExerciseRowActions', () => {
    it('returns view and copy actions for shared exercises', () => {
        const sharedExercise = { ...mockExercise, user_id: null }

        const items = getExerciseRowActions(
            sharedExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items).toHaveLength(2)

        const [view, copy] = items
        expect(view).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: Eye,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
        expect(copy).toEqual(
            expect.objectContaining({
                type: 'action',
                className: blueText,
                icon: Copy,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
    })

    it('returns edit, copy, and delete actions for user exercises', () => {
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items).toHaveLength(3)

        const [edit, copy, del] = items
        expect(edit).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: Pencil,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
        expect(copy).toEqual(
            expect.objectContaining({
                type: 'action',
                className: blueText,
                icon: Copy,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
        expect(del).toEqual(
            expect.objectContaining({
                type: 'action',
                className: redText,
                icon: Trash,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
    })

    it('disables only edit action when row is loading', () => {
        const items = getExerciseRowActions(
            mockExercise,
            true,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items[0]?.disabled).toBe(true)
        expect(items[1]?.disabled).toBeUndefined()
        expect(items[2]?.disabled).toBeUndefined()
    })

    it('calls openViewDialog on view for shared exercises', async () => {
        const openViewDialog = vi.fn()
        const sharedExercise = { ...mockExercise, user_id: null }
        const items = getExerciseRowActions(
            sharedExercise,
            false,
            openViewDialog,
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(openViewDialog).toHaveBeenCalledExactlyOnceWith(sharedExercise)
    })

    it('calls openCopyDialog on copy for shared exercises', async () => {
        const openCopyDialog = vi.fn()
        const sharedExercise = { ...mockExercise, user_id: null }
        const items = getExerciseRowActions(
            sharedExercise,
            false,
            vi.fn(),
            openCopyDialog,
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openCopyDialog).toHaveBeenCalledExactlyOnceWith(sharedExercise)
    })

    it('calls openEditDialog on edit for user exercises', async () => {
        const openEditDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            openEditDialog,
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(openEditDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })

    it('calls openCopyDialog on copy for user exercises', async () => {
        const openCopyDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            openCopyDialog,
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openCopyDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })

    it('calls openDeleteDialog on delete for user exercises', async () => {
        const openDeleteDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            openDeleteDialog
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[2]!.onSelect!(undefined)

        expect(openDeleteDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })
})
