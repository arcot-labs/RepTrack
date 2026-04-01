import { getAllDocs, getDoc } from '@/lib/docs'
import { describe, expect, it } from 'vitest'

const stubDocs = {
    '../docs/beta.md': '# Beta Title\nbody',
    '../docs/case-test.md': '# alpha Title\nbody',
    '../docs/no-heading.md': 'plain text without a heading',
}

describe('getDoc', () => {
    it('returns raw content for existing slug', () => {
        expect(getDoc('beta', stubDocs)).toBe('# Beta Title\nbody')
    })

    it('returns undefined for non-existent slug', () => {
        expect(getDoc('missing', stubDocs)).toBeUndefined()
    })
})

describe('getAllDocs', () => {
    it('derives slug/title pairs and sorts by title case-insensitively', () => {
        expect(getAllDocs(stubDocs)).toEqual([
            { slug: 'case-test', title: 'alpha Title' },
            { slug: 'beta', title: 'Beta Title' },
            { slug: 'no-heading', title: 'no heading' },
        ])
    })

    it('throws error for docs with invalid path', () => {
        const edgeCaseDocs = {
            '': '# Untitled\nbody',
        }

        expect(() => getAllDocs(edgeCaseDocs)).toThrow(
            'Skipping doc with invalid path: '
        )
    })
})
