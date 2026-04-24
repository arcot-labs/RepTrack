import { logger } from '@/lib/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const envMock = vi.hoisted(() => ({ getEnv: () => ({ ENV: 'dev' }) }))

let consoleDebugSpy: ReturnType<typeof vi.spyOn>
let consoleInfoSpy: ReturnType<typeof vi.spyOn>
let consoleWarnSpy: ReturnType<typeof vi.spyOn>
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

vi.mock('@/config/env', () => envMock)

describe('logger', () => {
    beforeEach(() => {
        consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(vi.fn())
        consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(vi.fn())
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(vi.fn())
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn())
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('logs debug messages when env is not prod', () => {
        logger.debug('log me')

        expect(consoleDebugSpy).toHaveBeenCalledExactlyOnceWith('log me')
    })

    it('does not log debug messages when env is prod', () => {
        envMock.getEnv = () => ({ ENV: 'prod' })
        logger.debug('skip me')

        expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('always forwards info/warn/error', () => {
        envMock.getEnv = () => ({ ENV: 'prod' })
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
