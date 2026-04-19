import {
    capitalizeWords,
    dash,
    formatIdentifier,
    formatNullableString,
    trimAndLowerText,
} from '@/lib/text'
import { describe, expect, it } from 'vitest'

describe('formatNullableString', () => {
    it('returns provided string when present', () => {
        expect(formatNullableString('value')).toBe('value')
    })

    it('returns dash placeholder for nullish values', () => {
        expect(formatNullableString()).toBe(dash)
        expect(formatNullableString(null)).toBe(dash)
    })
})

describe('capitalizeWords', () => {
    it('uppercases each word boundary', () => {
        expect(capitalizeWords('hello world')).toBe('Hello World')
        expect(capitalizeWords('multiple   spaces')).toBe('Multiple   Spaces')
        expect(capitalizeWords('already Capitalized')).toBe(
            'Already Capitalized'
        )
        expect(capitalizeWords('x1 y2')).toBe('X1 Y2')
    })
})

describe('trimAndLowerText', () => {
    it('trims surrounding whitespace and lowercases value', () => {
        expect(trimAndLowerText('  User.Name@Example.COM  ')).toBe(
            'user.name@example.com'
        )
    })
})

describe('formatIdentifier', () => {
    it('handles camelCase, snake_case, hyphenated, and mixed strings', () => {
        expect(formatIdentifier('simpleValue')).toBe('Simple Value')
        expect(formatIdentifier('get_user_by-id')).toBe('Get User By Id')
        expect(formatIdentifier('  trim_me_too  ')).toBe('Trim Me Too')
        expect(formatIdentifier('version2Value')).toBe('Version2 Value')
    })

    it('collapses underscores and hyphens into single spaces before capitalizing', () => {
        expect(formatIdentifier('multi__part---value')).toBe('Multi Part Value')
    })
})
