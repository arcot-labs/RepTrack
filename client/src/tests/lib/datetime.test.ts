import { formatDateTime, formatNullableDateTime } from '@/lib/datetime'
import { dash } from '@/lib/text'
import { describe, expect, it, vi } from 'vitest'

describe('formatDateTime', () => {
    it('returns rendered string', () => {
        const toLocaleString = vi
            .spyOn(Date.prototype, 'toLocaleString')
            .mockReturnValueOnce('localized')

        expect(formatDateTime('2026-01-01T00:00:00Z')).toBe('localized')
        expect(toLocaleString).toHaveBeenCalled()

        toLocaleString.mockRestore()
    })
})

describe('formatNullableDateTime', () => {
    it('calls formatDateTime when value exists', () => {
        const toLocaleString = vi
            .spyOn(Date.prototype, 'toLocaleString')
            .mockReturnValueOnce('localized-again')

        expect(formatNullableDateTime('2026-01-02T12:34:56Z')).toBe(
            'localized-again'
        )
        expect(toLocaleString).toHaveBeenCalled()

        toLocaleString.mockRestore()
    })

    it('returns dash when value is missing', () => {
        expect(formatNullableDateTime()).toBe(dash)
        expect(formatNullableDateTime(null)).toBe(dash)
    })
})
