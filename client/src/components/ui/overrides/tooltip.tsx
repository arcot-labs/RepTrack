// eslint-disable-next-line no-restricted-imports
import {
    Tooltip as UITooltip,
    TooltipContent as UITooltipContent,
    TooltipProvider as UITooltipProvider,
    TooltipTrigger as UITooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type UITooltipContentProps = React.ComponentProps<typeof UITooltipContent>

const TooltipProvider = UITooltipProvider
const TooltipTrigger = UITooltipTrigger
const Tooltip = UITooltip

function TooltipContent({ className, ...props }: UITooltipContentProps) {
    return <UITooltipContent className={cn('max-w-xs', className)} {...props} />
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
