import { Button } from '@/components/ui/overrides/button'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'

type RenderProps = Omit<ComponentProps<typeof Button>, 'children'>

const renderButton = (label: string, props: RenderProps = {}) => {
    render(<Button {...props}>{label}</Button>)
    return screen.getByRole('button', { name: label })
}

describe('button override', () => {
    it('renders success variant', () => {
        const button = renderButton('Save', { variant: 'success' })

        expect(button).toHaveAttribute('data-variant', 'default')
        expect(button).toHaveClass('bg-green-600')
    })

    it('merges className for success variant', () => {
        const button = renderButton('Save', {
            variant: 'success',
            className: 'w-full',
        })

        expect(button).toHaveClass('bg-green-600')
        expect(button).toHaveClass('w-full')
    })

    it('renders destructive variant', () => {
        const button = renderButton('Delete', { variant: 'destructive' })

        expect(button).toHaveAttribute('data-variant', 'destructive')
        expect(button).toHaveClass('dark:hover:bg-destructive/50')
    })

    it('merges className for destructive variant', () => {
        const button = renderButton('Delete', {
            variant: 'destructive',
            className: 'w-full',
        })

        expect(button).toHaveClass('dark:hover:bg-destructive/50')
        expect(button).toHaveClass('w-full')
    })

    it('passes through other variants unchanged', () => {
        const button = renderButton('Cancel', { variant: 'outline' })

        expect(button).toHaveAttribute('data-variant', 'outline')
        expect(button).not.toHaveClass('bg-green-600')
        expect(button).not.toHaveClass('dark:hover:bg-destructive/50')
    })

    it('passes through button props', () => {
        const button = renderButton('Submit', {
            variant: 'success',
            type: 'submit',
            disabled: true,
        })

        expect(button).toHaveAttribute('type', 'submit')
        expect(button).toBeDisabled()
    })
})
