import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let consoleDebugSpy: ReturnType<typeof vi.spyOn>
let consoleInfoSpy: ReturnType<typeof vi.spyOn>
let consoleWarnSpy: ReturnType<typeof vi.spyOn>
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

const loadLoggerWithEnv = async (envValue: string) => {
    vi.resetModules()
    vi.doMock('@/config/env', () => ({ env: { ENV: envValue } }))
    return import('@/lib/logger')
}

describe('logger', () => {
    beforeEach(() => {
        vi.resetModules()
        consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {
            /* empty */
        })
        consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {
            /* empty */
        })
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
            /* empty */
        })
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
            /* empty */
        })
    })

    afterEach(() => {
        vi.doUnmock('@/config/env')
        vi.restoreAllMocks()
    })

    it('logs debug messages when env is not prod', async () => {
        const { logger } = await loadLoggerWithEnv('dev')

        logger.debug('log me')

        expect(consoleDebugSpy).toHaveBeenCalledExactlyOnceWith('log me')
    })

    it('does not log debug messages when env is prod', async () => {
        const { logger } = await loadLoggerWithEnv('prod')

        logger.debug('skip me')

        expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('always forwards info/warn/error', async () => {
        const { logger } = await loadLoggerWithEnv('prod')

        logger.info('info', { some: 'context' })
        logger.warn('warn')
        logger.error('error')

        expect(consoleInfoSpy).toHaveBeenCalledExactlyOnceWith('info', {
            some: 'context',
        })
        expect(consoleWarnSpy).toHaveBeenCalledExactlyOnceWith('warn')
        expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith('error')
    })
})
