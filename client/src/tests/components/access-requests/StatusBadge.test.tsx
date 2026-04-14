import type { AccessRequestStatus } from '@/api/generated'
import { StatusBadge } from '@/components/access-requests/StatusBadge'
import { blueText, greenText, redText } from '@/lib/styles'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

const renderStatusBadge = (status: AccessRequestStatus) =>
    render(<StatusBadge status={status} />)

describe('StatusBadge', () => {
    it('renders pending badge', () => {
        const { container } = renderStatusBadge('pending')

        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toHaveTextContent('Pending')
        expect(badge).toHaveClass(blueText)
    })

    it('renders approved badge', () => {
        const { container } = renderStatusBadge('approved')

        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toHaveTextContent('Approved')
        expect(badge).toHaveClass(greenText)
    })

    it('renders rejected badge', () => {
        const { container } = renderStatusBadge('rejected')

        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toHaveTextContent('Rejected')
        expect(badge).toHaveClass(redText)
    })
})
