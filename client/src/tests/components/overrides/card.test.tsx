import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { render, screen } from '@testing-library/react'
import type { ComponentProps, JSXElementConstructor } from 'react'
import { describe, expect, it } from 'vitest'

type RenderProps<
    TComponent extends JSXElementConstructor<Record<string, unknown>>,
> = Omit<ComponentProps<TComponent>, 'children'>

const renderCard = (label: string, props: RenderProps<typeof Card> = {}) => {
    const testId = (props as unknown as { 'data-testid'?: string })[
        'data-testid'
    ]
    render(
        <Card data-testid="card" {...props}>
            {label}
        </Card>
    )
    return screen.getByTestId(testId ?? 'card')
}

const renderCardHeader = (
    label: string,
    props: RenderProps<typeof CardHeader> = {}
) => {
    render(
        <CardHeader data-testid="card-header" {...props}>
            {label}
        </CardHeader>
    )
    return screen.getByTestId('card-header')
}

const renderCardTitle = (
    label: string,
    props: RenderProps<typeof CardTitle> = {}
) => {
    render(
        <CardTitle data-testid="card-title" {...props}>
            {label}
        </CardTitle>
    )
    return screen.getByTestId('card-title')
}

const renderCardDescription = (
    label: string,
    props: RenderProps<typeof CardDescription> = {}
) => {
    render(
        <CardDescription data-testid="card-description" {...props}>
            {label}
        </CardDescription>
    )
    return screen.getByTestId('card-description')
}

const renderCardAction = (
    label: string,
    props: RenderProps<typeof CardAction> = {}
) => {
    render(
        <CardAction data-testid="card-action" {...props}>
            {label}
        </CardAction>
    )
    return screen.getByTestId('card-action')
}

const renderCardContent = (
    label: string,
    props: RenderProps<typeof CardContent> = {}
) => {
    render(
        <CardContent data-testid="card-content" {...props}>
            {label}
        </CardContent>
    )
    return screen.getByTestId('card-content')
}

const renderCardFooter = (
    label: string,
    props: RenderProps<typeof CardFooter> = {}
) => {
    render(
        <CardFooter data-testid="card-footer" {...props}>
            {label}
        </CardFooter>
    )
    return screen.getByTestId('card-footer')
}

describe('card override', () => {
    it('adds card layout defaults and merges className', () => {
        const card = renderCard('Content', { className: 'w-full' })

        expect(card).toHaveAttribute('data-slot', 'card')
        expect(card).toHaveClass('gap-0')
        expect(card).toHaveClass('py-1')
        expect(card).toHaveClass('max-md:rounded-none')
        expect(card).toHaveClass('w-full')
    })

    it('adds header layout defaults and merges className', () => {
        const header = renderCardHeader('Header', { className: 'px-2' })

        expect(header).toHaveAttribute('data-slot', 'card-header')
        expect(header).toHaveClass('-mb-1')
        expect(header).toHaveClass('pt-1')
        expect(header).toHaveClass('text-center')
        expect(header).toHaveClass('px-2')
    })

    it('adds title typography defaults and merges className', () => {
        const title = renderCardTitle('Title', { className: 'text-red-500' })

        expect(title).toHaveAttribute('data-slot', 'card-title')
        expect(title).toHaveClass('text-xl')
        expect(title).toHaveClass('font-bold')
        expect(title).toHaveClass('text-red-500')
    })

    it('passes through className for description', () => {
        const description = renderCardDescription('Description', {
            className: 'italic',
        })

        expect(description).toHaveAttribute('data-slot', 'card-description')
        expect(description).toHaveClass('italic')
    })

    it('passes through className for action', () => {
        const action = renderCardAction('Action', { className: 'text-sm' })

        expect(action).toHaveAttribute('data-slot', 'card-action')
        expect(action).toHaveClass('text-sm')
    })

    it('adds content padding defaults and merges className', () => {
        const content = renderCardContent('Body', { className: 'bg-red-500' })

        expect(content).toHaveAttribute('data-slot', 'card-content')
        expect(content).toHaveClass('px-2')
        expect(content).toHaveClass('pb-1')
        expect(content).toHaveClass('md:px-4')
        expect(content).toHaveClass('md:pb-3')
        expect(content).toHaveClass('bg-red-500')
    })

    it('adds footer padding defaults and merges className', () => {
        const footer = renderCardFooter('Footer', { className: 'justify-end' })

        expect(footer).toHaveAttribute('data-slot', 'card-footer')
        expect(footer).toHaveClass('px-2')
        expect(footer).toHaveClass('pb-1')
        expect(footer).toHaveClass('md:px-4')
        expect(footer).toHaveClass('md:pb-3')
        expect(footer).toHaveClass('justify-end')
    })

    it('passes through arbitrary props', () => {
        const card = renderCard('Content', {
            id: 'workout-card',
            // @ts-expect-error - testing passthrough of arbitrary props
            'data-testid': 'workout-card',
        })

        expect(card).toHaveAttribute('id', 'workout-card')
    })
})
