import * as React from 'react'

// eslint-disable-next-line no-restricted-imports
import {
    Card as UICard,
    CardAction as UICardAction,
    CardContent as UICardContent,
    CardDescription as UICardDescription,
    CardFooter as UICardFooter,
    CardHeader as UICardHeader,
    CardTitle as UICardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CardProps = React.ComponentProps<typeof UICard>
type CardHeaderProps = React.ComponentProps<typeof UICardHeader>
type CardTitleProps = React.ComponentProps<typeof UICardTitle>
type CardDescriptionProps = React.ComponentProps<typeof UICardDescription>
type CardActionProps = React.ComponentProps<typeof UICardAction>
type CardContentProps = React.ComponentProps<typeof UICardContent>
type CardFooterProps = React.ComponentProps<typeof UICardFooter>

function Card({ className, ...props }: CardProps) {
    return (
        <UICard
            className={cn(
                'gap-0 py-1 max-md:mb-0 max-md:rounded-none',
                className
            )}
            {...props}
        />
    )
}

function CardHeader({ className, ...props }: CardHeaderProps) {
    return (
        <UICardHeader
            className={cn('-mb-1 pt-1 text-center md:pt-3', className)}
            {...props}
        />
    )
}

function CardTitle({ className, ...props }: CardTitleProps) {
    return (
        <UICardTitle
            className={cn('text-xl font-bold', className)}
            {...props}
        />
    )
}

function CardDescription({ className, ...props }: CardDescriptionProps) {
    return <UICardDescription className={cn('', className)} {...props} />
}

function CardAction({ className, ...props }: CardActionProps) {
    return <UICardAction className={cn('', className)} {...props} />
}

function CardContent({ className, ...props }: CardContentProps) {
    return (
        <UICardContent
            className={cn('px-2 pb-1 md:px-4 md:pb-3', className)}
            {...props}
        />
    )
}

function CardFooter({ className, ...props }: CardFooterProps) {
    return (
        <UICardFooter
            className={cn('px-2 pb-1 md:px-4 md:pb-3', className)}
            {...props}
        />
    )
}

export {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
}
export type {
    CardActionProps,
    CardContentProps,
    CardDescriptionProps,
    CardFooterProps,
    CardHeaderProps,
    CardProps,
    CardTitleProps,
}
