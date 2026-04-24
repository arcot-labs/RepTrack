import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/overrides/tooltip'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'

/* eslint-disable */
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}
/* eslint-enable */

type ContentProps = Omit<ComponentProps<typeof TooltipContent>, 'children'>

const renderTooltip = (label: string, contentProps: ContentProps = {}) => {
    render(
        <TooltipProvider>
            <Tooltip open>
                <TooltipTrigger asChild>
                    <button type="button">Trigger</button>
                </TooltipTrigger>
                <TooltipContent {...contentProps}>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
    return document.querySelector('[data-slot="tooltip-content"]')
}

describe('tooltip override', () => {
    it('adds max width class to tooltip content', () => {
        const tooltip = renderTooltip('Helpful hint')

        expect(tooltip).toHaveClass('max-w-xs')
    })

    it('merges className for tooltip content', () => {
        const tooltip = renderTooltip('Helpful hint', { className: 'w-64' })

        expect(tooltip).toHaveClass('max-w-xs')
        expect(tooltip).toHaveClass('w-64')
    })

    it('passes through tooltip content props and renders trigger', () => {
        const tooltip = renderTooltip('Helpful hint', {
            id: 'hint-tooltip',
            // @ts-expect-error - testing passthrough of arbitrary props
            'data-testid': 'hint-tooltip',
        })

        expect(screen.getByRole('button', { name: 'Trigger' })).toHaveAttribute(
            'data-slot',
            'tooltip-trigger'
        )
        expect(screen.getByTestId('hint-tooltip')).toBe(tooltip)
        expect(tooltip).toHaveAttribute('id', 'hint-tooltip')
    })
})
