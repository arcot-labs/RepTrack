import {
    isEmailValue,
    preprocessString,
    preprocessTrim,
    preprocessTrimAndLower,
} from '@/lib/validation'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

describe('preprocessString', () => {
    it('normalizes string values with provided transform', () => {
        expect(preprocessString('  Value  ', (value) => value.trim())).toBe(
            'Value'
        )
    })

    it('returns non-string values unchanged', () => {
        expect(preprocessString(123, (value) => value.trim())).toBe(123)
    })
})

describe('preprocessTrim', () => {
    it('trims string input before validating against target schema', () => {
        const schema = preprocessTrim(z.string().min(1).max(5))

        expect(schema.parse('  value  ')).toBe('value')
    })
})

describe('preprocessTrimAndLower', () => {
    it('trims and lowercases string input before validating against target schema', () => {
        const schema = preprocessTrimAndLower(z.email())

        expect(schema.parse('  User.Name@Example.COM  ')).toBe(
            'user.name@example.com'
        )
    })
})

describe('isEmailValue', () => {
    it('returns true for valid email-shaped values', () => {
        expect(isEmailValue('user@example.com')).toBe(true)
    })

    it('returns false for non-email values', () => {
        expect(isEmailValue('some_username')).toBe(false)
    })
})
