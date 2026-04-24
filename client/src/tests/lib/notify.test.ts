import { notify } from '@/lib/notify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}))

const toastMocks = vi.hoisted(() => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

vi.mock('sonner', () => ({
    toast: toastMocks,
}))

describe('notify', () => {
    beforeEach(() => {
        Object.values(loggerMocks).forEach((mock) => mock.mockReset())
        Object.values(toastMocks).forEach((mock) => mock.mockReset())
    })

    it('logs debug and shows a success toast', () => {
        notify.success('done')

        expect(loggerMocks.debug).toHaveBeenCalledExactlyOnceWith(
            'Success notification:',
            'done'
        )
        expect(toastMocks.success).toHaveBeenCalledExactlyOnceWith('done')
    })

    it('logs info and shows an info toast', () => {
        notify.info('info message')

        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Info notification:',
            'info message'
        )
        expect(toastMocks.info).toHaveBeenCalledExactlyOnceWith('info message')
    })

    it('logs warn and shows a warning toast', () => {
        notify.warning('be careful')

        expect(loggerMocks.warn).toHaveBeenCalledExactlyOnceWith(
            'Warning notification:',
            'be careful'
        )
        expect(toastMocks.warning).toHaveBeenCalledExactlyOnceWith('be careful')
    })

    it('logs errors and shows an error toast with duration options', () => {
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
