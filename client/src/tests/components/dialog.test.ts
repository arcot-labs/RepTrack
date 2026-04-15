import { useActionDialog, useDialog } from '@/components/dialog'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const onConfirm = vi.fn()

// eslint-disable-next-line @typescript-eslint/no-empty-function
const renderUseDialog = (onConfirm = async () => {}) =>
    renderHook(() => useDialog<number>(onConfirm))

// eslint-disable-next-line @typescript-eslint/no-empty-function
const renderUseActionDialog = (onConfirm = async () => {}) =>
    renderHook(() => useActionDialog<number, string>(onConfirm))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useDialog', () => {
    it('initializes state', () => {
        const { result } = renderUseDialog()

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.payload).toBeNull()
    })

    it('opens dialog', () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(1)
        })

        expect(result.current.state.isOpen).toBe(true)
        expect(result.current.state.payload).toBe(1)
    })

    it('closes dialog', () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(2)
        })
        act(() => {
            result.current.close()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.payload).toBe(2)
    })

    it('calls onConfirm', async () => {
        const { result } = renderUseDialog(onConfirm)

        act(() => {
            result.current.open(3)
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith(3)
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm for null payload', async () => {
        const { result } = renderUseDialog(onConfirm)

        act(() => {
            result.current.open(null as never)
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).not.toHaveBeenCalled()
    })
})

describe('useActionDialog', () => {
    it('initializes state', () => {
        const { result } = renderUseActionDialog()

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.payload).toBeNull()
        expect(result.current.state.action).toBeNull()
    })

    it('opens dialog', () => {
        const { result } = renderUseActionDialog()

        act(() => {
            result.current.open(1, 'approved')
        })

        expect(result.current.state.isOpen).toBe(true)
        expect(result.current.state.payload).toBe(1)
        expect(result.current.state.action).toBe('approved')
    })

    it('closes dialog', () => {
        const { result } = renderUseActionDialog()

        act(() => {
            result.current.open(2, 'approved')
        })
        act(() => {
            result.current.close()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.payload).toBe(2)
        expect(result.current.state.action).toBe('approved')
    })

    it('calls onConfirm', async () => {
        const { result } = renderUseActionDialog(onConfirm)

        act(() => {
            result.current.open(3, 'rejected')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith(3, 'rejected')
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm for falsy payload and action', async () => {
        const { result } = renderUseActionDialog(onConfirm)

        act(() => {
            result.current.open(0, '')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith(0, '')
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm for null request', async () => {
        const { result } = renderUseActionDialog(onConfirm)

        act(() => {
            result.current.open(null as never, 'rejected')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('does not call onConfirm for null action', async () => {
        const { result } = renderUseActionDialog(onConfirm)

        act(() => {
            result.current.open(4, null as never)
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('closes dialog after confirming', async () => {
        const { result } = renderUseActionDialog()

        act(() => {
            result.current.open(5, 'approved')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.payload).toBe(5)
        expect(result.current.state.action).toBe('approved')
    })

    it('handles multiple cycles', () => {
        const { result } = renderUseActionDialog()

        act(() => {
            result.current.open(6, 'approved')
        })

        expect(result.current.state.action).toBe('approved')

        act(() => {
            result.current.close()
        })

        act(() => {
            result.current.open(7, 'rejected')
        })

        expect(result.current.state.payload).toBe(7)
        expect(result.current.state.action).toBe('rejected')
    })
})
