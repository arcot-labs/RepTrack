import { DocsSidebar } from '@/components/docs/DocsSidebar'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

describe('DocsSidebar', () => {
    it('renders empty state when no items exist', () => {
        render(<DocsSidebar items={[]} />)

        expect(screen.getByText('No docs available')).toBeInTheDocument()
        expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('renders links and marks active doc', () => {
        render(
            <MemoryRouter initialEntries={['/docs/guide']}>
                <DocsSidebar
                    items={[
                        { slug: 'getting-started', title: 'Getting started' },
                        { slug: 'guide', title: 'Guide' },
                    ]}
                />
            </MemoryRouter>
        )

        const gettingStarted = screen.getByRole('link', {
            name: 'Getting started',
        })
        const guide = screen.getByRole('link', { name: 'Guide' })

        expect(gettingStarted).toHaveAttribute('href', '/docs/getting-started')
        expect(guide).toHaveAttribute('href', '/docs/guide')

        expect(gettingStarted.className).toContain('block')
        expect(gettingStarted.className).toContain('text-muted-foreground')
        expect(gettingStarted.className).toContain('hover:bg-muted')

        expect(guide.className).toContain('block')
        expect(guide.className).toContain('bg-muted')
        expect(guide.className).toContain('font-medium')
    })
})
