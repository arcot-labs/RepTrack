import { capitalizeWords, formatIdentifier } from '@/lib/text'
import { describe, expect, it } from 'vitest'

describe('capitalizeWords', () => {
    it('uppercases each word boundary', () => {
        expect(capitalizeWords('hello world')).toBe('Hello World')
        expect(capitalizeWords('multiple   spaces')).toBe('Multiple   Spaces')
        expect(capitalizeWords('already Capitalized')).toBe(
            'Already Capitalized'
        )
    })
})

describe('formatIdentifier', () => {
    it('handles camelCase, snake_case, hyphenated, and mixed strings', () => {
        expect(formatIdentifier('simpleValue')).toBe('Simple Value')
        expect(formatIdentifier('get_user_by-id')).toBe('Get User By Id')
        expect(formatIdentifier('  trim_me_too  ')).toBe('Trim Me Too')
    })

    it('collapses underscores and hyphens into single spaces before capitalizing', () => {
        expect(formatIdentifier('multi__part---value')).toBe('Multi Part Value')
    })
})
