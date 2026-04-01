import { cn } from '@/lib/utils'
import { describe, expect, it } from 'vitest'

describe('cn', () => {
    it('joins class names together', () => {
        expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
    })

    it('filters out falsy values and objects', () => {
        expect(cn('base', ' ', { active: true, hidden: false })).toBe(
            'base active'
        )
    })

    it('merges tailwind utility conflicts by keeping the later value', () => {
        const result = cn('text-sm text-muted-foreground', 'text-lg')

        expect(result).toContain('text-lg')
        expect(result).toContain('text-muted-foreground')
        expect(result).not.toContain('text-sm')
    })
})
