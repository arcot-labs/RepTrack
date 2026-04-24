import type { vi } from 'vitest'

export function getMockProps(mockFn: ReturnType<typeof vi.fn>): unknown {
    const call = mockFn.mock.calls[0]
    if (!call) throw new Error('Mock was not called')
    return call[0] as unknown
}

export const createDeferred = <T>() => {
    let resolvePromise!: (value: T) => void
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve
    })
    return { promise, resolve: resolvePromise }
}
