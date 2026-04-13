import { RoleBadge } from '@/components/users/RoleBadge'
import { blueText, greenText } from '@/lib/styles'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

const renderRoleBadge = (isAdmin: boolean) =>
    render(<RoleBadge isAdmin={isAdmin} />)

describe('RoleBadge', () => {
    it('renders admin badge', () => {
        const { container } = renderRoleBadge(true)

        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toHaveTextContent('Admin')
        expect(badge).toHaveClass(greenText)
    })

    it('renders user badge', () => {
        const { container } = renderRoleBadge(false)

        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toHaveTextContent('User')
        expect(badge).toHaveClass(blueText)
    })
})
