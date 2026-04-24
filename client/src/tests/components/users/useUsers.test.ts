import { UserService, type UserPublic } from '@/api/generated'
import { useUsers } from '@/components/users/useUsers'
import { handleApiError } from '@/lib/http'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('@/api/generated', () => ({
    UserService: {
        getUsers: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockUsers: UserPublic[] = [
    {
        id: 1,
        email: 'user1@example.com',
        username: 'user1',
        first_name: 'Test',
        last_name: 'User',
        is_admin: false,
        created_at: '2026-04-13T00:00:00Z',
        updated_at: '2026-04-13T00:00:00Z',
    },
    {
        id: 2,
        email: 'admin@example.com',
        username: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        is_admin: true,
        created_at: '2026-04-14T00:00:00Z',
        updated_at: '2026-04-14T00:00:00Z',
    },
]

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

describe('useUsers', () => {
    it('loads users on mount', async () => {
        vi.mocked(UserService).getUsers.mockResolvedValue({
            data: mockUsers,
            error: undefined,
        } as never)

        const { result } = renderHook(() => useUsers())

        expect(result.current.isLoading).toBe(true)
        expect(result.current.users).toEqual([])

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.users).toEqual(mockUsers)
        expect(vi.mocked(UserService).getUsers).toHaveBeenCalledOnce()
        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Fetched users',
            mockUsers
        )
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('handles error and clears users', async () => {
        const apiError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(UserService).getUsers.mockResolvedValue({
            data: null,
            error: apiError,
        } as never)

        const { result } = renderHook(() => useUsers())

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(apiError, {
            fallbackMessage: 'Failed to fetch users',
        })
        expect(result.current.users).toEqual([])
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })
})
