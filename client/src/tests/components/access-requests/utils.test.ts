import {
    AccessRequestService,
    type AccessRequestPublic,
    type UserPublic,
} from '@/api/generated'
import {
    getAccessRequestRowActions,
    getDialogConfirmButtonText,
    getStatusFilterOptions,
    handleUpdateAccessRequest,
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

const callHandleUpdate = async (
    payload: { error: unknown } = { error: undefined },
    request: AccessRequestPublic = mockRequest,
    status: 'approved' | 'rejected' = 'approved',
    user: UserPublic = mockUser
) => {
    vi.mocked(AccessRequestService).updateAccessRequestStatus.mockReturnValue(
        Promise.resolve(payload) as never
    )

    const onRequestUpdated = vi.fn()
    const onReloadRequests = vi.fn().mockResolvedValue(undefined)
    const setRowLoading = vi.fn()

    await handleUpdateAccessRequest(
        request,
        status,
        user,
        onRequestUpdated,
        onReloadRequests,
        setRowLoading
    )
    return { onRequestUpdated, onReloadRequests, setRowLoading }
}

describe('handleUpdateAccessRequest', () => {
    let successSpy: MockInstance<typeof notify.success>
    let warningSpy: MockInstance<typeof notify.warning>

    beforeEach(() => {
        vi.setSystemTime(new Date(mockTimestamp))
        successSpy = vi.spyOn(notify, 'success').mockImplementation(vi.fn())
        warningSpy = vi.spyOn(notify, 'warning').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('calls service with correct path & body', async () => {
        await callHandleUpdate()

        expect(
            vi.mocked(AccessRequestService).updateAccessRequestStatus
        ).toHaveBeenCalledExactlyOnceWith({
            path: { access_request_id: mockRequest.id },
            body: { status: 'approved' },
        })
    })

    it('handles success', async () => {
        const { onRequestUpdated, onReloadRequests, setRowLoading } =
            await callHandleUpdate()

        expect(successSpy).toHaveBeenCalledExactlyOnceWith(
            'Access request status updated'
        )
        expect(onRequestUpdated).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                ...mockRequest,
                status: 'approved',
                reviewed_at: mockTimestamp,
                reviewer: mockUser,
                updated_at: mockTimestamp,
            })
        )
        expect(onReloadRequests).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles error', async () => {
        vi.mocked(handleApiError).mockResolvedValue(undefined)

        const mockError = { code: 'SOME_ERROR', detail: 'error' }
        const { onRequestUpdated, onReloadRequests, setRowLoading } =
            await callHandleUpdate({ error: mockError })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
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
        expect(onReloadRequests).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles access_request_not_pending error', async () => {
        vi.mocked(handleApiError).mockImplementationOnce(
            async (error, options) => {
                await options.httpErrorHandlers?.access_request_not_pending?.(
                    error as never
                )
            }
        )

        const mockError = {
            code: 'access_request_not_pending',
            detail: 'already reviewed',
        }
        const { onRequestUpdated, onReloadRequests, setRowLoading } =
            await callHandleUpdate({ error: mockError })

        expect(warningSpy).toHaveBeenCalledExactlyOnceWith(
            'Access request has already been reviewed. Reloading data'
        )
        expect(onRequestUpdated).not.toHaveBeenCalled()
        expect(onReloadRequests).toHaveBeenCalledOnce()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
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
        expect(approve).toEqual(
            expect.objectContaining({
                type: 'action',
                className: greenText,
                icon: Check,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
        expect(reject).toEqual(
            expect.objectContaining({
                type: 'action',
                className: redText,
                icon: X,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
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

        expect(openConfirmDialog).toHaveBeenCalledExactlyOnceWith(
            mockRequest,
            'approved'
        )
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

        expect(openConfirmDialog).toHaveBeenCalledExactlyOnceWith(
            mockRequest,
            'rejected'
        )
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

describe('getDialogConfirmButtonText', () => {
    it('returns correct text for confirming actions', () => {
        expect(getDialogConfirmButtonText('approved', true)).toBe(
            'Approving...'
        )
        expect(getDialogConfirmButtonText('rejected', true)).toBe(
            'Rejecting...'
        )
    })

    it('returns correct text for non-confirming actions', () => {
        expect(getDialogConfirmButtonText('approved', false)).toBe('Approve')
        expect(getDialogConfirmButtonText('rejected', false)).toBe('Reject')
    })
})
