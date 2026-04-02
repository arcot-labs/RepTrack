import { buildEnv } from '@/config/env'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

describe('buildEnv', () => {
    it('reduces VITE_ keys into parsed env object', () => {
        const parsed = buildEnv({
            VITE_ENV: 'stage',
            VITE_IMAGE_TAG: 'tag-1',
            VITE_API_URL: 'https://example.com',
            VITE_SOME_OTHER_VAR: 'ignore-me',
            SOME_OTHER_VAR: 'ignore-me-too',
        })

        expect(parsed).toMatchObject({
            ENV: 'stage',
            IMAGE_TAG: 'tag-1',
            API_URL: 'https://example.com',
        })
    })

    it('throws when the schema validation fails', () => {
        expect(() =>
            buildEnv({
                VITE_ENV: 'dev',
            })
        ).toThrow('Failed to parse env vars')
    })

    it('stringifies boolean values before validation', () => {
        const parsed = buildEnv({
            VITE_ENV: 'prod',
            VITE_IMAGE_TAG: true,
            VITE_API_URL: 'https://example.com',
        })

        expect(parsed.IMAGE_TAG).toBe('true')
    })
})

const loadGetEnv = async () => (await import('@/config/env')).getEnv()

describe('getEnv', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.stubEnv('VITE_ENV', 'test')
        vi.stubEnv('VITE_IMAGE_TAG', 'img-tag')
        vi.stubEnv('VITE_API_URL', 'https://example.com')
    })

    it('builds env from stubbed VITE vars', async () => {
        const env = await loadGetEnv()

        expect(env).toMatchObject({
            ENV: 'test',
            IMAGE_TAG: 'img-tag',
            API_URL: 'https://example.com',
        })
    })

    it('returns cached env on subsequent calls', async () => {
        const first = await loadGetEnv()

        vi.stubEnv('VITE_IMAGE_TAG', 'another-tag')

        const second = await loadGetEnv()

        expect(second).toBe(first)
        expect(second.IMAGE_TAG).toBe('img-tag')
    })
})
