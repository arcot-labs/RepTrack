import { ExerciseService, type ExercisePublic } from '@/api/generated'
import { useExercises } from '@/components/exercises/useExercises'
import { handleApiError } from '@/lib/http'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('@/api/generated', () => ({
    ExerciseService: {
        getExercises: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockExercises: ExercisePublic[] = [
    {
        id: 1,
        user_id: 2,
        name: 'Back Squat',
        description: 'Barbell squat',
        created_at: '2026-04-16T00:00:00Z',
        updated_at: '2026-04-17T00:00:00Z',
        muscle_groups: [],
    },
    {
        id: 2,
        user_id: 2,
        name: 'Bench Press',
        description: 'Barbell bench press',
        created_at: '2026-04-10T00:00:00Z',
        updated_at: '2026-04-11T00:00:00Z',
        muscle_groups: [],
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

describe('useExercises', () => {
    it('loads exercises on mount', async () => {
        vi.mocked(ExerciseService).getExercises.mockResolvedValue({
            data: mockExercises,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useExercises())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.exercises).toEqual([])

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.exercises).toEqual(mockExercises)
        expect(vi.mocked(ExerciseService).getExercises).toHaveBeenCalledOnce()
        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Fetched exercises',
            mockExercises
        )
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('handles error and clears exercises', async () => {
        const apiError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(ExerciseService).getExercises.mockResolvedValue({
            data: null,
            error: apiError,
        } as never)

        const { result } = renderHook(() => useExercises())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(apiError, {
            fallbackMessage: 'Failed to fetch exercises',
        })
        expect(result.current.exercises).toEqual([])
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('handles reload', async () => {
        const first = [mockExercises[0]]
        const second = [mockExercises[1]]

        vi.mocked(ExerciseService)
            .getExercises.mockResolvedValueOnce({
                data: first,
                error: undefined,
            } as never)
            .mockResolvedValueOnce({
                data: second,
                error: undefined,
            } as never)

        const { result } = renderHook(() => useExercises())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.exercises).toEqual(first)

        await act(async () => {
            await result.current.reload()
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.exercises).toEqual(second)
        expect(vi.mocked(ExerciseService).getExercises).toHaveBeenCalledTimes(2)
    })

    it('handles remove', async () => {
        vi.mocked(ExerciseService).getExercises.mockResolvedValue({
            data: mockExercises,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useExercises())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        act(() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.current.remove(mockExercises[0]!.id)
        })

        expect(result.current.exercises).toEqual([mockExercises[1]])
    })
})
