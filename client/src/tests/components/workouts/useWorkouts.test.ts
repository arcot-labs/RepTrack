import { WorkoutService, type WorkoutBase } from '@/api/generated'
import { useWorkouts } from '@/components/workouts/useWorkouts'
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
    WorkoutService: {
        getWorkouts: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockWorkouts: WorkoutBase[] = [
    {
        id: 1,
        user_id: 2,
        started_at: '2026-04-15T00:00:00Z',
        ended_at: null,
        notes: null,
        created_at: '2026-04-16T00:00:00Z',
        updated_at: '2026-04-17T00:00:00Z',
    },
    {
        id: 2,
        user_id: 2,
        started_at: '2026-04-18T00:00:00Z',
        ended_at: '2026-04-18T01:00:00Z',
        notes: 'Upper day',
        created_at: '2026-04-18T00:00:00Z',
        updated_at: '2026-04-18T01:00:00Z',
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

describe('useWorkouts', () => {
    it('loads workouts on mount', async () => {
        vi.mocked(WorkoutService).getWorkouts.mockResolvedValue({
            data: mockWorkouts,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useWorkouts())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.workouts).toEqual([])

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.workouts).toEqual(mockWorkouts)
        expect(vi.mocked(WorkoutService).getWorkouts).toHaveBeenCalledOnce()
        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Fetched workouts',
            mockWorkouts
        )
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('handles error and clears workouts', async () => {
        const apiError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(WorkoutService).getWorkouts.mockResolvedValue({
            data: null,
            error: apiError,
        } as never)

        const { result } = renderHook(() => useWorkouts())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(apiError, {
            fallbackMessage: 'Failed to fetch workouts',
        })
        expect(result.current.workouts).toEqual([])
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('handles reload', async () => {
        const first = [mockWorkouts[0]]
        const second = [mockWorkouts[1]]

        vi.mocked(WorkoutService)
            .getWorkouts.mockResolvedValueOnce({
                data: first,
                error: undefined,
            } as never)
            .mockResolvedValueOnce({
                data: second,
                error: undefined,
            } as never)

        const { result } = renderHook(() => useWorkouts())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.workouts).toEqual(first)

        await act(async () => {
            await result.current.reload()
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.workouts).toEqual(second)
        expect(vi.mocked(WorkoutService).getWorkouts).toHaveBeenCalledTimes(2)
    })

    it('handles remove', async () => {
        vi.mocked(WorkoutService).getWorkouts.mockResolvedValue({
            data: mockWorkouts,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useWorkouts())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        act(() => {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.current.remove(mockWorkouts[0]!.id)
        })

        expect(result.current.workouts).toEqual([mockWorkouts[1]])
    })
})
