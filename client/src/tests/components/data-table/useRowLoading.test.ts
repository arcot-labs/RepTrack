import {
    updateLoadingIds,
    useRowLoading,
} from '@/components/data-table/useRowLoading'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

const renderUseRowLoading = () => renderHook(() => useRowLoading())

describe('updateLoadingIds', () => {
    it('adds requestId to loading set', () => {
        const initial = new Set<number>([2, 3])
        const result = updateLoadingIds(initial, 1, true)
        expect([...result]).toEqual([2, 3, 1])
    })

    it('removes requestId from loading set', () => {
        const initial = new Set<number>([1, 2, 3])
        const result = updateLoadingIds(initial, 2, false)
        expect([...result]).toEqual([1, 3])
    })

    it('does not mutate original set', () => {
        const initial = new Set<number>([1, 2])
        const result = updateLoadingIds(initial, 3, true)
        expect(result).not.toBe(initial)
        expect([...initial]).toEqual([1, 2])
    })
})

describe('useRowLoading', () => {
    it('initializes state', () => {
        const { result } = renderUseRowLoading()

        expect(result.current.loadingIds).toEqual(new Set())
    })

    it('handles row loading state', () => {
        const { result } = renderUseRowLoading()

        expect(result.current.isRowLoading(1)).toBe(false)
        act(() => {
            result.current.setRowLoading(1, true)
        })
        expect(result.current.isRowLoading(1)).toBe(true)
        act(() => {
            result.current.setRowLoading(1, false)
        })
        expect(result.current.isRowLoading(1)).toBe(false)
    })
})
