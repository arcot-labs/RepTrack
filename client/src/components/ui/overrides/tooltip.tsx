import * as React from 'react'

// eslint-disable-next-line no-restricted-imports
import {
    Tooltip as UITooltip,
    TooltipContent as UITooltipContent,
    TooltipProvider as UITooltipProvider,
    TooltipTrigger as UITooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type UITooltipContentProps = React.ComponentProps<typeof UITooltipContent>

type TooltipContentProps = UITooltipContentProps

function TooltipContent({ className, ...props }: TooltipContentProps) {
    return <UITooltipContent className={cn('max-w-xs', className)} {...props} />
}

const Tooltip = UITooltip
const TooltipProvider = UITooltipProvider
const TooltipTrigger = UITooltipTrigger

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
export type { TooltipContentProps }
