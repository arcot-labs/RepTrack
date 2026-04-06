import { FormField } from '@/components/FormField'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

describe('FormField', () => {
    it('renders label and children', () => {
        render(
            <FormField label="Email">
                <input />
            </FormField>
        )

        expect(screen.getByText('Email')).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('associates label with input via htmlFor', () => {
        render(
            <FormField label="Email" htmlFor="email">
                <input id="email" />
            </FormField>
        )

        expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('renders error message when provided', () => {
        render(
            <FormField label="Email" error="Required">
                <input />
            </FormField>
        )

        expect(screen.getByText('Required')).toBeInTheDocument()
    })
})
