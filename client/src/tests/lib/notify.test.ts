import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}

const toastMocks = {
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
}

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('sonner', () => ({
    toast: toastMocks,
}))

const loadNotify = async () => {
    vi.resetModules()
    return import('@/lib/notify')
}

describe('notify', () => {
    beforeEach(() => {
        Object.values(loggerMocks).forEach((mock) => mock.mockReset())
        Object.values(toastMocks).forEach((mock) => mock.mockReset())
    })

    it('logs debug and shows a success toast', async () => {
        const { notify } = await loadNotify()

        notify.success('done')

        expect(loggerMocks.debug).toHaveBeenCalledExactlyOnceWith(
            'Success notification:',
            'done'
        )
        expect(toastMocks.success).toHaveBeenCalledExactlyOnceWith('done')
    })

    it('logs info and shows an info toast', async () => {
        const { notify } = await loadNotify()

        notify.info('info message')

        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Info notification:',
            'info message'
        )
        expect(toastMocks.info).toHaveBeenCalledExactlyOnceWith('info message')
    })

    it('logs warn and shows a warning toast', async () => {
        const { notify } = await loadNotify()

        notify.warning('be careful')

        expect(loggerMocks.warn).toHaveBeenCalledExactlyOnceWith(
            'Warning notification:',
            'be careful'
        )
        expect(toastMocks.warning).toHaveBeenCalledExactlyOnceWith('be careful')
    })

    it('logs errors and shows an error toast with duration options', async () => {
        const { notify } = await loadNotify()

        notify.error('fatal')

        expect(loggerMocks.error).toHaveBeenCalledExactlyOnceWith(
            'Error notification:',
            'fatal'
        )
        expect(toastMocks.error).toHaveBeenCalledExactlyOnceWith('fatal', {
            duration: 10000,
        })
    })
})
