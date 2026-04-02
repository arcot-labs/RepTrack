import { buildEnv } from '@/config/env'
import { describe, expect, it } from 'vitest'

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
