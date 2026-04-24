import { useRemoteSearch } from '@/components/useRemoteSearch'
import { handleApiError } from '@/lib/http'
import { createDeferred } from '@/tests/utils'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

interface TestItem {
    id: number
    name: string
}

interface TestResult {
    id: number
}

interface SearchResponse {
    data?: TestResult[] | null
    error?: unknown
}

const items: TestItem[] = [
    { id: 1, name: 'Chest' },
    { id: 2, name: 'Back' },
    { id: 3, name: 'Legs' },
]

const createSearchMock = () =>
    vi.fn<(...args: [string, number]) => Promise<SearchResponse>>()

const renderUseRemoteSearch = ({
    search = createSearchMock(),
    enabled = true,
    hookItems = items,
    fallbackMessage = 'Failed to search muscle groups',
}: {
    search?: ReturnType<typeof createSearchMock>
    enabled?: boolean
    hookItems?: TestItem[]
    fallbackMessage?: string
} = {}) => {
    const hook = renderHook(
        ({
            currentSearch,
            currentEnabled,
            currentItems,
            currentFallbackMessage,
        }) =>
            useRemoteSearch<TestItem, TestResult>({
                items: currentItems,
                enabled: currentEnabled,
                fallbackMessage: currentFallbackMessage,
                search: currentSearch,
                getItemId: (item) => item.id,
                getResultId: (result) => result.id,
            }),
        {
            initialProps: {
                currentSearch: search,
                currentEnabled: enabled,
                currentItems: hookItems,
                currentFallbackMessage: fallbackMessage,
            },
        }
    )
    return {
        ...hook,
        search,
    }
}

const advanceDebounce = async () => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
    })
}

const flushPromises = async () => {
    await act(async () => {
        await Promise.resolve()
    })
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.mocked(handleApiError).mockResolvedValue(undefined)
})

afterEach(async () => {
    await act(async () => {
        await vi.runOnlyPendingTimersAsync()
    })
    vi.useRealTimers()
})

describe('useRemoteSearch', () => {
    it('initializes with all items and no loading state', () => {
        const { result, search } = renderUseRemoteSearch()

        expect(result.current.searchQuery).toBe('')
        expect(result.current.isSearching).toBe(false)
        expect(result.current.displayedItems).toEqual(items)
        expect(search).not.toHaveBeenCalled()
    })

    it('debounces search input, trims query, and maps results back to items', async () => {
        const pendingSearch = createDeferred<SearchResponse>()
        const { result, search } = renderUseRemoteSearch()

        search.mockReturnValueOnce(pendingSearch.promise)

        act(() => {
            result.current.setSearchQuery('  bac  ')
        })

        expect(result.current.isSearching).toBe(false)

        await advanceDebounce()

        expect(result.current.isSearching).toBe(true)
        expect(search).toHaveBeenCalledExactlyOnceWith('bac', items.length)

        pendingSearch.resolve({
            data: [{ id: 2 }, { id: 1 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual([items[1], items[0]])
        expect(result.current.isSearching).toBe(false)
    })

    it('ignores stale responses from earlier searches', async () => {
        const firstSearch = createDeferred<SearchResponse>()
        const secondSearch = createDeferred<SearchResponse>()
        const { result, search } = renderUseRemoteSearch()

        search
            .mockReturnValueOnce(firstSearch.promise)
            .mockReturnValueOnce(secondSearch.promise)

        act(() => {
            result.current.setSearchQuery('ch')
        })
        await advanceDebounce()

        act(() => {
            result.current.setSearchQuery('ba')
        })
        await advanceDebounce()

        expect(search).toHaveBeenNthCalledWith(1, 'ch', items.length)
        expect(search).toHaveBeenNthCalledWith(2, 'ba', items.length)

        firstSearch.resolve({
            data: [{ id: 1 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual(items)
        expect(result.current.isSearching).toBe(true)

        secondSearch.resolve({
            data: [{ id: 2 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual([items[1]])
        expect(result.current.isSearching).toBe(false)
    })

    it('refreshes current search without changing query', async () => {
        const firstSearch = createDeferred<SearchResponse>()
        const secondSearch = createDeferred<SearchResponse>()
        const { result, search } = renderUseRemoteSearch()

        search
            .mockReturnValueOnce(firstSearch.promise)
            .mockReturnValueOnce(secondSearch.promise)

        act(() => {
            result.current.setSearchQuery('legs')
        })
        await advanceDebounce()

        firstSearch.resolve({
            data: [{ id: 1 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual([items[0]])

        act(() => {
            result.current.refreshSearchResults()
        })

        expect(result.current.isSearching).toBe(true)
        expect(search).toHaveBeenCalledTimes(2)

        secondSearch.resolve({
            data: [{ id: 3 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual([items[2]])

        expect(search).toHaveBeenNthCalledWith(1, 'legs', items.length)
        expect(search).toHaveBeenNthCalledWith(2, 'legs', items.length)
        expect(result.current.isSearching).toBe(false)
    })

    it('does not refresh when there is no debounced search query', () => {
        const { result, search } = renderUseRemoteSearch()

        act(() => {
            result.current.refreshSearchResults()
        })

        expect(search).not.toHaveBeenCalled()
        expect(result.current.isSearching).toBe(false)
        expect(result.current.displayedItems).toEqual(items)
    })

    it('handles search errors and falls back to all items', async () => {
        const error = { code: 'search_failed', detail: 'boom' }
        const { result, search } = renderUseRemoteSearch()

        search.mockResolvedValue({ error })

        act(() => {
            result.current.setSearchQuery('legs')
        })
        await advanceDebounce()

        await flushPromises()

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(error, {
            fallbackMessage: 'Failed to search muscle groups',
        })

        expect(result.current.displayedItems).toEqual(items)
        expect(result.current.isSearching).toBe(false)
    })

    it('falls back to all items when search returns null data', async () => {
        const { result, search } = renderUseRemoteSearch()

        search.mockResolvedValue({ data: null })

        act(() => {
            result.current.setSearchQuery('legs')
        })
        await advanceDebounce()
        await flushPromises()

        expect(search).toHaveBeenCalledExactlyOnceWith('legs', items.length)
        expect(result.current.displayedItems).toEqual(items)
        expect(result.current.isSearching).toBe(false)
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('does not call search for query that is invalid after normalization', async () => {
        const { result, search } = renderUseRemoteSearch()

        act(() => {
            result.current.setSearchQuery(` ${'a'.repeat(256)} `)
        })
        await advanceDebounce()
        await flushPromises()

        expect(search).not.toHaveBeenCalled()
        expect(result.current.displayedItems).toEqual(items)
        expect(result.current.isSearching).toBe(false)
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('does not call search for query that becomes empty after trimming', async () => {
        const { result, search } = renderUseRemoteSearch()

        act(() => {
            result.current.setSearchQuery('   ')
        })
        await advanceDebounce()
        await flushPromises()

        expect(search).not.toHaveBeenCalled()
        expect(result.current.displayedItems).toEqual(items)
        expect(result.current.isSearching).toBe(false)
        expect(handleApiError).not.toHaveBeenCalled()
    })

    it('caps remote search limit at 1000 items', async () => {
        const largeItems: TestItem[] = Array.from(
            { length: 1005 },
            (_, index) => ({
                id: index + 1,
                name: `Item ${String(index + 1)}`,
            })
        )
        const { result, search } = renderUseRemoteSearch({
            hookItems: largeItems,
        })

        search.mockResolvedValue({ data: [] })

        act(() => {
            result.current.setSearchQuery('legs')
        })
        await advanceDebounce()
        await flushPromises()

        expect(search).toHaveBeenCalledExactlyOnceWith('legs', 1000)
        expect(result.current.isSearching).toBe(false)
    })

    it('resets search state and cancels in-flight results when disabled', async () => {
        const pendingSearch = createDeferred<SearchResponse>()
        const { result, rerender, search } = renderUseRemoteSearch({
            search: createSearchMock(),
        })

        search.mockReturnValueOnce(pendingSearch.promise)

        act(() => {
            result.current.setSearchQuery('chest')
        })
        await advanceDebounce()

        expect(result.current.isSearching).toBe(true)
        expect(search).toHaveBeenCalledExactlyOnceWith('chest', items.length)

        act(() => {
            rerender({
                currentSearch: search,
                currentEnabled: false,
                currentItems: items,
                currentFallbackMessage: 'Failed to search muscle groups',
            })
        })

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0)
        })

        expect(result.current.searchQuery).toBe('')
        expect(result.current.isSearching).toBe(false)
        expect(result.current.displayedItems).toEqual(items)

        pendingSearch.resolve({
            data: [{ id: 1 }],
        })
        await flushPromises()

        expect(result.current.displayedItems).toEqual(items)
        expect(handleApiError).not.toHaveBeenCalled()
    })
})
