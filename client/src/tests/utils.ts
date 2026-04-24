import type { vi } from 'vitest'

export function getMockCallArg(
    mockFn: ReturnType<typeof vi.fn>,
    callIdx = 0,
    argIdx = 0
): unknown {
    const call = mockFn.mock.calls[callIdx]
    if (!call) throw new Error('Mock was not called')
    return call[argIdx] as unknown
}

export const createDeferred = <T>() => {
    let resolvePromise!: (value: T) => void
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve
    })
    return { promise, resolve: resolvePromise }
}
