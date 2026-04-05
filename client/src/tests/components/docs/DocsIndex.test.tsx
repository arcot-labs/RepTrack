import { DocsIndex } from '@/components/docs/DocsIndex'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('DocsIndex', () => {
    it('renders correct message', () => {
        render(<DocsIndex />)

        expect(screen.getByText(/click on a document/i)).toBeInTheDocument()
    })
})
