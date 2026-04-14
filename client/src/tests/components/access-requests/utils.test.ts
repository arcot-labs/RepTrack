import {
    AccessRequestService,
    type AccessRequestPublic,
    type UserPublic,
} from '@/api/generated'
import {
    getAccessRequestRowActions,
    getStatusFilterOptions,
    handleConfirm,
    setRequestLoading,
} from '@/components/access-requests/utils'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { greenText, redText } from '@/lib/styles'
import { Check, X } from 'lucide-react'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('@/lib/text', () => ({
    capitalizeWords: vi.fn((str: string) => `${str} - capitalized`),
}))

vi.mock('@/api/generated', () => ({
    AccessRequestService: {
        updateAccessRequestStatus: vi.fn(),
    },
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockRequest: AccessRequestPublic = {
    id: 1,
    email: 'user@example.com',
    first_name: 'Test',
    last_name: 'User',
    status: 'pending',
    reviewed_at: null,
    reviewer: null,
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
}

const mockUser: UserPublic = {
    id: 42,
    email: 'admin@example.com',
    username: 'adminuser',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
}

const mockTimestamp = '2026-04-13T12:00:00.000Z'

describe('setRequestLoading', () => {
    it('adds requestId to loading set', () => {
        const initial = new Set<number>([2, 3])
        let result: Set<number> = initial

        const setIsLoadingRequestIds = (
            value: Set<number> | ((prev: Set<number>) => Set<number>)
        ) => {
            if (typeof value === 'function')
                result = (value as (prev: Set<number>) => Set<number>)(result)
            else result = value
        }

        setRequestLoading(setIsLoadingRequestIds, 1, true)
        expect([...result]).toEqual([2, 3, 1])
    })

    it('removes requestId from loading set', () => {
        const initial = new Set<number>([1, 2, 3])
        let result: Set<number> = initial

        const setIsLoadingRequestIds = (
            value: Set<number> | ((prev: Set<number>) => Set<number>)
        ) => {
            if (typeof value === 'function')
                result = (value as (prev: Set<number>) => Set<number>)(result)
            else result = value
        }

        setRequestLoading(setIsLoadingRequestIds, 2, false)
        expect([...result]).toEqual([1, 3])
    })

    it('does not mutate original set', () => {
        const initial = new Set<number>([1, 2])
        let result: Set<number> = initial

        const setIsLoadingRequestIds = (
            value: Set<number> | ((prev: Set<number>) => Set<number>)
        ) => {
            if (typeof value === 'function')
                result = (value as (prev: Set<number>) => Set<number>)(result)
            else result = value
        }

        setRequestLoading(setIsLoadingRequestIds, 3, true)
        expect(result).not.toBe(initial)
        expect([...initial]).toEqual([1, 2])
    })
})

describe('handleConfirm', () => {
    let successSpy: MockInstance<typeof notify.success>
    let warningSpy: MockInstance<typeof notify.warning>

    beforeEach(() => {
        vi.setSystemTime(new Date(mockTimestamp))
        successSpy = vi.spyOn(notify, 'success').mockImplementation(vi.fn())
        warningSpy = vi.spyOn(notify, 'warning').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('calls service with correct path & body', async () => {
        vi.mocked(
            AccessRequestService
        ).updateAccessRequestStatus.mockReturnValue(
            Promise.resolve({ error: undefined }) as never
        )

        const onRequestUpdated = vi.fn()
        const onReloadRequests = vi.fn().mockResolvedValue(undefined)
        const setIsLoadingAccessRequestIds = vi.fn()

        await handleConfirm(
            mockRequest,
            'approved',
            mockUser,
            onRequestUpdated,
            onReloadRequests,
            setIsLoadingAccessRequestIds
        )

        expect(
            vi.mocked(AccessRequestService).updateAccessRequestStatus
        ).toHaveBeenCalledWith({
            path: { access_request_id: mockRequest.id },
            body: { status: 'approved' },
        })
        expect(setIsLoadingAccessRequestIds).toHaveBeenCalledTimes(2)
    })

    it('handles success', async () => {
        vi.mocked(
            AccessRequestService
        ).updateAccessRequestStatus.mockReturnValue(
            Promise.resolve({ error: null }) as never
        )

        const onRequestUpdated = vi.fn()
        const onReloadRequests = vi.fn().mockResolvedValue(undefined)
        const setIsLoadingAccessRequestIds = vi.fn()

        await handleConfirm(
            mockRequest,
            'approved',
            mockUser,
            onRequestUpdated,
            onReloadRequests,
            setIsLoadingAccessRequestIds
        )

        expect(successSpy).toHaveBeenCalledWith('Access request status updated')
        expect(onRequestUpdated).toHaveBeenCalledWith(
            expect.objectContaining({
                ...mockRequest,
                status: 'approved',
                reviewed_at: mockTimestamp,
                reviewer: mockUser,
                updated_at: mockTimestamp,
            })
        )
        expect(setIsLoadingAccessRequestIds).toHaveBeenCalledTimes(2)
    })

    it('handles error', async () => {
        const mockError = { code: 'SOME_ERROR', detail: 'error' }
        vi.mocked(
            AccessRequestService
        ).updateAccessRequestStatus.mockReturnValue(
            Promise.resolve({ data: undefined, error: mockError }) as never
        )
        vi.mocked(handleApiError).mockResolvedValue(undefined)

        const onRequestUpdated = vi.fn()
        const onReloadRequests = vi.fn().mockResolvedValue(undefined)
        const setIsLoadingAccessRequestIds = vi.fn()

        await handleConfirm(
            mockRequest,
            'approved',
            mockUser,
            onRequestUpdated,
            onReloadRequests,
            setIsLoadingAccessRequestIds
        )

        expect(handleApiError).toHaveBeenCalledWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to update access request status',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                httpErrorHandlers: expect.objectContaining({
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    access_request_not_pending: expect.any(Function),
                }),
            })
        )
        expect(successSpy).not.toHaveBeenCalled()
        expect(onRequestUpdated).not.toHaveBeenCalled()
        expect(setIsLoadingAccessRequestIds).toHaveBeenCalledTimes(2)
    })

    it('handles access_request_not_pending error', async () => {
        const mockError = {
            code: 'access_request_not_pending',
            detail: 'already reviewed',
        }
        vi.mocked(
            AccessRequestService
        ).updateAccessRequestStatus.mockReturnValue(
            Promise.resolve({ data: undefined, error: mockError }) as never
        )
        vi.mocked(handleApiError).mockImplementationOnce(
            async (error, options) => {
                await options.httpErrorHandlers?.access_request_not_pending?.(
                    error as never
                )
            }
        )

        const onRequestUpdated = vi.fn()
        const onReloadRequests = vi.fn().mockResolvedValue(undefined)
        const setIsLoadingAccessRequestIds = vi.fn()

        await handleConfirm(
            mockRequest,
            'approved',
            mockUser,
            onRequestUpdated,
            onReloadRequests,
            setIsLoadingAccessRequestIds
        )

        expect(warningSpy).toHaveBeenCalledWith(
            'Access request has already been reviewed. Reloading data'
        )
        expect(onReloadRequests).toHaveBeenCalledOnce()
        expect(onRequestUpdated).not.toHaveBeenCalled()
        expect(setIsLoadingAccessRequestIds).toHaveBeenCalledTimes(2)
    })
})

describe('getAccessRequestRowActions', () => {
    it('returns empty array for non-pending rows', () => {
        const approvedRow = { ...mockRequest, status: 'approved' as const }
        expect(getAccessRequestRowActions(approvedRow, false, vi.fn())).toEqual(
            []
        )

        const rejectedRow = { ...mockRequest, status: 'rejected' as const }
        expect(getAccessRequestRowActions(rejectedRow, false, vi.fn())).toEqual(
            []
        )
    })

    it('returns items for pending rows', () => {
        const items = getAccessRequestRowActions(mockRequest, false, vi.fn())
        expect(items).toHaveLength(2)

        const [approve, reject] = items
        expect(approve?.className).toBe(greenText)
        expect(approve?.icon).toBe(Check)
        expect(approve?.disabled).toBe(false)
        expect(reject?.className).toBe(redText)
        expect(reject?.icon).toBe(X)
        expect(reject?.disabled).toBe(false)
    })

    it('disables items when row is loading', () => {
        const items = getAccessRequestRowActions(mockRequest, true, vi.fn())
        expect(items[0]?.disabled).toBe(true)
        expect(items[1]?.disabled).toBe(true)
    })

    it('calls openConfirmDialog on approve', async () => {
        const openConfirmDialog = vi.fn()
        const items = getAccessRequestRowActions(
            mockRequest,
            false,
            openConfirmDialog
        )
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(openConfirmDialog).toHaveBeenCalledWith(mockRequest, 'approved')
    })

    it('calls openConfirmDialog on reject', async () => {
        const openConfirmDialog = vi.fn()
        const items = getAccessRequestRowActions(
            mockRequest,
            false,
            openConfirmDialog
        )
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openConfirmDialog).toHaveBeenCalledWith(mockRequest, 'rejected')
    })
})

describe('getStatusFilterOptions', () => {
    it('returns filter option for each access request status', () => {
        const options = getStatusFilterOptions()

        expect(options).toHaveLength(3)
        expect(options.map((o) => o.label)).toEqual([
            'pending - capitalized',
            'approved - capitalized',
            'rejected - capitalized',
        ])
        expect(options.map((o) => o.value)).toEqual([
            'pending',
            'approved',
            'rejected',
        ])
    })
})
