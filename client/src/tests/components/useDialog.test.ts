import { useDialog } from '@/components/useDialog'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// tests use payload/action pattern
type DialogArgs = [number, string]

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
const createOnConfirm = () => vi.fn(async (..._args: DialogArgs) => {})
const onConfirm = createOnConfirm()

const renderUseDialog = (onConfirm = createOnConfirm()) =>
    renderHook(() => useDialog<DialogArgs>(onConfirm))

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useDialog', () => {
    it('initializes state', () => {
        const { result } = renderUseDialog()

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.isConfirming).toBe(false)
        expect(result.current.state.args).toBeNull()
    })

    it('opens dialog', () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(1, 'approved')
        })

        expect(result.current.state.isOpen).toBe(true)
        expect(result.current.state.isConfirming).toBe(false)
        expect(result.current.state.args).toEqual([1, 'approved'])
    })

    it('closes dialog', () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(2, 'approved')
        })
        act(() => {
            result.current.close()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.isConfirming).toBe(false)
        expect(result.current.state.args).toEqual([2, 'approved'])
    })

    it('calls onConfirm', async () => {
        const { result } = renderUseDialog(onConfirm)

        act(() => {
            result.current.open(3, 'rejected')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith(3, 'rejected')
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onConfirm for falsy args', async () => {
        const { result } = renderUseDialog(onConfirm)

        act(() => {
            // @ts-expect-error testing call with no args
            result.current.open()
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledWith()
        expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('does not call onConfirm if already confirming', async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        let resolveConfirm: () => void = () => {}
        const pendingConfirm = new Promise<void>((resolve) => {
            resolveConfirm = resolve
        })
        const onConfirm = vi.fn(() => pendingConfirm)
        const { result } = renderUseDialog(onConfirm)

        act(() => {
            result.current.open(8, 'approved')
        })

        expect(result.current.state.isConfirming).toBe(false)

        let confirmPromise: Promise<void> = Promise.resolve()

        act(() => {
            confirmPromise = result.current.confirm()
        })

        expect(result.current.state.isConfirming).toBe(true)

        await act(async () => {
            // second call while first is pending
            await result.current.confirm()
        })

        expect(onConfirm).toHaveBeenCalledTimes(1)

        // clean up pending promise
        await act(async () => {
            resolveConfirm()
            await confirmPromise
        })

        expect(result.current.state.isConfirming).toBe(false)
    })

    it('does not call onConfirm when no args are set', async () => {
        const { result } = renderUseDialog(onConfirm)

        await act(async () => {
            await result.current.confirm()
        })

        expect(onConfirm).not.toHaveBeenCalled()
        expect(result.current.state.isConfirming).toBe(false)
    })

    it('closes dialog after confirming', async () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(5, 'approved')
        })
        await act(async () => {
            await result.current.confirm()
        })

        expect(result.current.state.isOpen).toBe(false)
        expect(result.current.state.args).toEqual([5, 'approved'])
    })

    it('handles multiple cycles', () => {
        const { result } = renderUseDialog()

        act(() => {
            result.current.open(6, 'approved')
        })

        expect(result.current.state.args).toEqual([6, 'approved'])

        act(() => {
            result.current.close()
        })

        act(() => {
            result.current.open(7, 'rejected')
        })

        expect(result.current.state.args).toEqual([7, 'rejected'])
    })
})
