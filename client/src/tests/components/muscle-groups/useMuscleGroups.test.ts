import { MuscleGroupService, type MuscleGroupPublic } from '@/api/generated'
import { useMuscleGroups } from '@/components/muscle-groups/useMuscleGroups'
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
    MuscleGroupService: {
        getMuscleGroups: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockMuscleGroups: MuscleGroupPublic[] = [
    {
        id: 10,
        name: 'quads',
        description: 'Quadriceps muscles',
    },
    {
        id: 11,
        name: 'glutes',
        description: 'Gluteal muscles',
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

describe('useMuscleGroups', () => {
    it('loads muscle groups on mount', async () => {
        vi.mocked(MuscleGroupService).getMuscleGroups.mockResolvedValue({
            data: mockMuscleGroups,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useMuscleGroups())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.muscleGroups).toEqual([])

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.muscleGroups).toEqual(mockMuscleGroups)
        expect(
            vi.mocked(MuscleGroupService).getMuscleGroups
        ).toHaveBeenCalledOnce()
        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Fetched muscle groups',
            mockMuscleGroups
        )
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('handles error and clears muscle groups', async () => {
        const apiError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(MuscleGroupService).getMuscleGroups.mockResolvedValue({
            data: null,
            error: apiError,
        } as never)

        const { result } = renderHook(() => useMuscleGroups())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(apiError, {
            fallbackMessage: 'Failed to fetch muscle groups',
        })
        expect(result.current.muscleGroups).toEqual([])
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('handles reload', async () => {
        const first = [mockMuscleGroups[0]]
        const second = [mockMuscleGroups[1]]

        vi.mocked(MuscleGroupService)
            .getMuscleGroups.mockResolvedValueOnce({
                data: first,
                error: undefined,
            } as never)
            .mockResolvedValueOnce({
                data: second,
                error: undefined,
            } as never)

        const { result } = renderHook(() => useMuscleGroups())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.muscleGroups).toEqual(first)

        await act(async () => {
            await result.current.reload()
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.muscleGroups).toEqual(second)
        expect(
            vi.mocked(MuscleGroupService).getMuscleGroups
        ).toHaveBeenCalledTimes(2)
    })
})
