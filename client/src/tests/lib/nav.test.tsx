import { NavItem } from '@/lib/nav'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

describe('NavItem', () => {
    it('renders children inside link with base styles', () => {
        render(
            <MemoryRouter initialEntries={['/active']}>
                <NavItem to="/active">Dashboard</NavItem>
            </MemoryRouter>
        )

        const link = screen.getByRole('link', { name: 'Dashboard' })
        expect(link).toBeInTheDocument()
        expect(link).toHaveClass('text-xl', 'font-medium', 'transition-colors')
    })

    it('applies active styling when current route matches', () => {
        render(
            <MemoryRouter initialEntries={['/active']}>
                <NavItem to="/active">Active Link</NavItem>
            </MemoryRouter>
        )

        const link = screen.getByRole('link', { name: 'Active Link' })
        expect(link).toHaveClass('text-primary')
        expect(link).not.toHaveClass('text-muted-foreground')
    })

    it('applies muted styling when route does not match', () => {
        render(
            <MemoryRouter initialEntries={['/other']}>
                <NavItem to="/active">Inactive Link</NavItem>
            </MemoryRouter>
        )

        const link = screen.getByRole('link', { name: 'Inactive Link' })
        expect(link).toHaveClass('text-muted-foreground')
        expect(link).not.toHaveClass('text-primary')
    })
})
