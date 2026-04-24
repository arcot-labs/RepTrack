import * as React from 'react'

// eslint-disable-next-line no-restricted-imports
import { Button as UIButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type UIButtonProps = React.ComponentProps<typeof UIButton>

type ButtonProps = Omit<UIButtonProps, 'variant'> & {
    variant?: UIButtonProps['variant'] | 'success'
}

function Button({ variant = 'default', className, ...props }: ButtonProps) {
    if (variant === 'success') {
        return (
            <UIButton
                variant="default"
                className={cn(
                    'bg-green-600 text-white hover:bg-green-600/90 focus-visible:ring-green-600/20 dark:bg-green-600/60 dark:hover:bg-green-600/50 dark:focus-visible:ring-green-600/40',
                    className
                )}
                {...props}
            />
        )
    }

    if (variant === 'destructive') {
        return (
            <UIButton
                variant="destructive"
                className={cn('dark:hover:bg-destructive/50', className)}
                {...props}
            />
        )
    }

    return <UIButton variant={variant} className={className} {...props} />
}

export { Button }
export type { ButtonProps as AppButtonProps }
