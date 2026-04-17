import { handleApiError } from '@/lib/http'
import { useEffect, useMemo, useRef, useState } from 'react'

interface UseRemoteSearchProps<TItem, TResult> {
    items: TItem[]
    enabled?: boolean
    fallbackMessage: string
    search: (
        query: string,
        limit: number
    ) => Promise<{
        data?: TResult[] | null
        error?: unknown
    }>
    getItemId: (item: TItem) => number
    getResultId: (result: TResult) => number
}

export function useRemoteSearch<TItem, TResult>({
    items,
    enabled = true,
    fallbackMessage,
    search,
    getItemId,
    getResultId,
}: UseRemoteSearchProps<TItem, TResult>) {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<TResult[] | null>(null)
    const [searchRefreshTick, setSearchRefreshTick] = useState(0)
    const searchRequestIdRef = useRef(0)
    const searchRef = useRef(search)

    // consumers can pass inline callback, which changes identity on each render
    // prevents re-triggering of remote-search effect on each render
    useEffect(() => {
        searchRef.current = search
    }, [search])

    // derives debounced search query
    useEffect(() => {
        const timeoutDelay = enabled ? 300 : 0
        const timeout = setTimeout(() => {
            if (!enabled) {
                searchRequestIdRef.current += 1
                setSearchQuery('')
                setDebouncedSearchQuery('')
                setSearchResults(null)
                setIsSearching(false)
                return
            }

            const nextSearchQuery = searchQuery.trim()
            setDebouncedSearchQuery(nextSearchQuery)

            if (!nextSearchQuery) {
                searchRequestIdRef.current += 1
                setSearchResults(null)
                setIsSearching(false)
                return
            }

            setIsSearching(true)
        }, timeoutDelay)

        return () => {
            clearTimeout(timeout)
        }
    }, [enabled, searchQuery])

    // performs remote search
    useEffect(() => {
        // previous effect handles clearing results & canceling requests
        if (!enabled || !debouncedSearchQuery) return

        const requestId = searchRequestIdRef.current + 1
        searchRequestIdRef.current = requestId

        void searchRef
            .current(debouncedSearchQuery, Math.min(items.length, 1000))
            .then(async ({ data, error }) => {
                if (requestId !== searchRequestIdRef.current) return
                if (error) {
                    await handleApiError(error, {
                        fallbackMessage,
                    })
                    setSearchResults(null)
                    return
                }
                setSearchResults(data ?? null)
            })
            .finally(() => {
                if (requestId === searchRequestIdRef.current)
                    setIsSearching(false)
            })
    }, [
        enabled,
        debouncedSearchQuery,
        items.length,
        fallbackMessage,
        // re-trigger effect on manual refresh
        searchRefreshTick,
    ])

    const refreshSearchResults = () => {
        if (!enabled || !debouncedSearchQuery) return
        setIsSearching(true)
        setSearchRefreshTick((prev) => prev + 1)
    }

    const displayedItems = useMemo(() => {
        if (!searchResults) return items

        const itemsById = new Map(items.map((item) => [getItemId(item), item]))
        return searchResults
            .map((result) => itemsById.get(getResultId(result)))
            .filter((item): item is TItem => !!item)
    }, [items, searchResults, getItemId, getResultId])

    return {
        searchQuery,
        setSearchQuery,
        isSearching,
        refreshSearchResults,
        displayedItems,
    }
}
