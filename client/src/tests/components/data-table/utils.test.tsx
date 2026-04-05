import { shouldTruncate } from '@/components/data-table/utils'
import { describe, expect, it } from 'vitest'

describe('shouldTruncate', () => {
    it('returns false if element is null', () => {
        expect(shouldTruncate(null)).toBe(false)
    })

    it('returns false if text is not truncated', () => {
        const element = document.createElement('span')
        Object.defineProperty(element, 'offsetWidth', { value: 100 })
        Object.defineProperty(element, 'scrollWidth', { value: 100 })

        expect(shouldTruncate(element)).toBe(false)
    })

    it('returns true if text is truncated', () => {
        const element = document.createElement('span')
        Object.defineProperty(element, 'offsetWidth', { value: 50 })
        Object.defineProperty(element, 'scrollWidth', { value: 100 })

        expect(shouldTruncate(element)).toBe(true)
    })
})
