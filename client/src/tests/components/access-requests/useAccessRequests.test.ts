import { AccessRequestService, type AccessRequestPublic } from '@/api/generated'
import { useAccessRequests } from '@/components/access-requests/useAccessRequests'
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
    AccessRequestService: {
        getAccessRequests: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockRequests: AccessRequestPublic[] = [
    {
        id: 1,
        email: 'user1@example.com',
        first_name: 'Test',
        last_name: 'User',
        status: 'pending',
        reviewed_at: null,
        reviewer: null,
        created_at: '2026-04-13T00:00:00Z',
        updated_at: '2026-04-13T00:00:00Z',
    },
    {
        id: 2,
        email: 'user2@example.com',
        first_name: 'Second',
        last_name: 'User',
        status: 'approved',
        reviewed_at: '2026-04-14T00:00:00Z',
        reviewer: null,
        created_at: '2026-04-12T00:00:00Z',
        updated_at: '2026-04-14T00:00:00Z',
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

describe('useAccessRequests', () => {
    it('loads access requests on mount', async () => {
        vi.mocked(AccessRequestService).getAccessRequests.mockResolvedValue({
            data: mockRequests,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useAccessRequests())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.requests).toEqual([])

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.requests).toEqual(mockRequests)
        expect(
            vi.mocked(AccessRequestService).getAccessRequests
        ).toHaveBeenCalledOnce()
        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Fetched access requests',
            mockRequests
        )
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('handles error and clears requests', async () => {
        const apiError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(AccessRequestService).getAccessRequests.mockResolvedValue({
            data: null,
            error: apiError,
        } as never)

        const { result } = renderHook(() => useAccessRequests())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(apiError, {
            fallbackMessage: 'Failed to fetch access requests',
        })
        expect(result.current.requests).toEqual([])
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('handles reload', async () => {
        const first = [mockRequests[0]]
        const second = [mockRequests[1]]

        vi.mocked(AccessRequestService)
            .getAccessRequests.mockResolvedValueOnce({
                data: first,
                error: undefined,
            } as never)
            .mockResolvedValueOnce({
                data: second,
                error: undefined,
            } as never)

        const { result } = renderHook(() => useAccessRequests())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })
        expect(result.current.requests).toEqual(first)

        await act(async () => {
            await result.current.reload()
        })

        expect(result.current.isLoading).toBe(false)
        expect(result.current.requests).toEqual(second)
        expect(
            vi.mocked(AccessRequestService).getAccessRequests
        ).toHaveBeenCalledTimes(2)
    })

    it('handles update', async () => {
        vi.mocked(AccessRequestService).getAccessRequests.mockResolvedValue({
            data: mockRequests,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useAccessRequests())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        const updated: AccessRequestPublic = {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...mockRequests[0]!,
            status: 'rejected',
            updated_at: '2026-04-15T00:00:00Z',
        }

        act(() => {
            result.current.update(updated)
        })

        expect(result.current.requests).toEqual([updated, mockRequests[1]])
    })
})
