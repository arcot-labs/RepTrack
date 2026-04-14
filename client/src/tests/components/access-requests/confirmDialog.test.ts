import type { AccessRequestPublic } from '@/api/generated'
import { useConfirmDialog } from '@/components/access-requests/confirmDialog'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pendingRequest: AccessRequestPublic = {
    id: 1,
    email: 'test-user@example.com',
    first_name: 'Test',
    last_name: 'User',
    status: 'pending',
    reviewed_at: null,
    reviewer: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const renderUseConfirmDialog = (onConfirm = async () => {}) =>
    renderHook(() => useConfirmDialog(onConfirm))

describe('useConfirmDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('initializes state', () => {
        const { result } = renderUseConfirmDialog()

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.request).toBeNull()
        expect(result.current.state.action).toBeNull()
    })

    it('opens dialog', () => {
        const { result } = renderUseConfirmDialog()

        act(() => {
            result.current.open(pendingRequest, 'approved')
        })

        expect(result.current.state.isOpen).toBe(true)
        expect(result.current.state.request).toBe(pendingRequest)
        expect(result.current.state.action).toBe('approved')
    })

    it('closes dialog', () => {
        const { result } = renderUseConfirmDialog()

        act(() => {
            result.current.open(pendingRequest, 'approved')
        })
        act(() => {
            result.current.close()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.request).toBe(pendingRequest)
        expect(result.current.state.action).toBe('approved')
    })

    it('calls onConfirm', async () => {
        const onConfirm = vi.fn()
        const { result } = renderUseConfirmDialog(onConfirm)

        act(() => {
            result.current.open(pendingRequest, 'rejected')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith(pendingRequest, 'rejected')
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm if missing request or action', async () => {
        const onConfirm = vi.fn()
        const { result } = renderUseConfirmDialog(onConfirm)

        act(() => {
            result.current.open(null as never, 'rejected')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('closes dialog after confirming', async () => {
        const { result } = renderUseConfirmDialog()

        act(() => {
            result.current.open(pendingRequest, 'approved')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.request).toBe(pendingRequest)
        expect(result.current.state.action).toBe('approved')
    })

    it('handles multiple cycles', () => {
        const { result } = renderUseConfirmDialog()

        act(() => {
            result.current.open(pendingRequest, 'approved')
        })

        expect(result.current.state.action).toBe('approved')

        act(() => {
            result.current.close()
        })

        const secondRequest: AccessRequestPublic = {
            ...pendingRequest,
            id: 2,
        }

        act(() => {
            result.current.open(secondRequest, 'rejected')
        })

        expect(result.current.state.request).toBe(secondRequest)
        expect(result.current.state.action).toBe('rejected')
    })
})
