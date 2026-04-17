import { useState } from 'react'

export function updateLoadingIds<TId extends string | number>(
    loadingIds: Set<TId>,
    id: TId,
    isLoading: boolean
): Set<TId> {
    const next = new Set(loadingIds)
    if (isLoading) next.add(id)
    else next.delete(id)
    return next
}

export function useRowLoading<TId extends string | number>() {
    const [loadingIds, setLoadingIds] = useState<Set<TId>>(new Set())

    const isRowLoading = (id: TId) => loadingIds.has(id)

    const setRowLoading = (id: TId, isLoading: boolean) => {
        setLoadingIds((prev) => updateLoadingIds(prev, id, isLoading))
    }

    return {
        loadingIds,
        isRowLoading,
        setRowLoading,
    }
}
