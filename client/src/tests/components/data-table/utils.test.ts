import {
    getCellClassName,
    getEdgePaddingClassName,
    getHeaderClassName,
    isTruncatedText,
} from '@/components/data-table/utils'
import { describe, expect, it } from 'vitest'

describe('isTruncatedText', () => {
    it('returns false if element is null', () => {
        expect(isTruncatedText(null)).toBe(false)
    })

    it('returns false if text is not truncated', () => {
        const element = document.createElement('span')
        Object.defineProperty(element, 'offsetWidth', { value: 100 })
        Object.defineProperty(element, 'scrollWidth', { value: 100 })

        expect(isTruncatedText(element)).toBe(false)
    })

    it('returns true if text is truncated', () => {
        const element = document.createElement('span')
        Object.defineProperty(element, 'offsetWidth', { value: 50 })
        Object.defineProperty(element, 'scrollWidth', { value: 100 })

        expect(isTruncatedText(element)).toBe(true)
    })
})

describe('getEdgePaddingClassName', () => {
    it('returns base class when no edge conditions match', () => {
        const result = getEdgePaddingClassName(
            1,
            3,
            'col-1',
            {
                firstColumnExcludeIds: [],
                lastColumnExcludeIds: [],
            },
            'base'
        )

        expect(result).toBe('base')
    })

    it('adds left padding for first column', () => {
        const result = getEdgePaddingClassName(0, 3, 'col-1', {
            firstColumnExcludeIds: [],
            lastColumnExcludeIds: [],
        })

        expect(result).toBe('pl-4')
    })

    it('adds right padding for last column', () => {
        const result = getEdgePaddingClassName(3, 3, 'col-1', {
            firstColumnExcludeIds: [],
            lastColumnExcludeIds: [],
        })

        expect(result).toBe('pr-4')
    })

    it('adds both paddings for single-column row', () => {
        const result = getEdgePaddingClassName(0, 0, 'col-1', {
            firstColumnExcludeIds: [],
            lastColumnExcludeIds: [],
        })

        expect(result).toBe('pl-4 pr-4')
    })

    it('respects exclusion rules for first column', () => {
        const result = getEdgePaddingClassName(0, 3, 'actions', {
            firstColumnExcludeIds: ['actions'],
            lastColumnExcludeIds: [],
        })

        expect(result).toBeUndefined()
    })

    it('respects exclusion rules for last column', () => {
        const result = getEdgePaddingClassName(3, 3, 'actions', {
            firstColumnExcludeIds: [],
            lastColumnExcludeIds: ['actions'],
        })

        expect(result).toBeUndefined()
    })

    it('appends padding to base class', () => {
        const result = getEdgePaddingClassName(
            0,
            3,
            'col-1',
            {
                firstColumnExcludeIds: [],
                lastColumnExcludeIds: [],
            },
            'text-sm'
        )

        expect(result).toBe('text-sm pl-4')
    })
})

describe('getHeaderClassName', () => {
    it('returns headerClassName from meta', () => {
        const header = {
            column: {
                columnDef: {
                    meta: {
                        headerClassName: 'text-red',
                    },
                },
            },
        } as never

        expect(getHeaderClassName(header)).toBe('text-red')
    })

    it('returns undefined when meta is missing', () => {
        const header = {
            column: {
                columnDef: {},
            },
        } as never

        expect(getHeaderClassName(header)).toBeUndefined()
    })
})

describe('getCellClassName', () => {
    it('always includes base height class', () => {
        const cell = {
            column: {
                id: 'col-1',
                columnDef: {},
            },
        } as never

        expect(getCellClassName(cell)).toContain('h-10')
    })

    it('adds py-1 for actions column', () => {
        const cell = {
            column: {
                id: 'actions',
                columnDef: {},
            },
        } as never

        expect(getCellClassName(cell)).toContain('py-1')
    })

    it('includes cellClassName from meta', () => {
        const cell = {
            column: {
                id: 'col-1',
                columnDef: {
                    meta: {
                        cellClassName: 'text-blue',
                    },
                },
            },
        } as never

        expect(getCellClassName(cell)).toContain('text-blue')
    })
})
