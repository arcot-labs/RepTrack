import { shouldTruncate } from '@/components/data-table/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/overrides/tooltip'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'

interface DataTableTruncatedCellProps {
    value: string
    className?: string
}

/**
 * Renders text truncated to a single line with a tooltip showing the full
 * value on hover. Use `className` to set a max-width (e.g. `max-w-48`).
 */
export function DataTableTruncatedCell({
    value,
    className,
}: DataTableTruncatedCellProps) {
    const textRef = useRef<HTMLSpanElement | null>(null)
    const [isTruncated, setIsTruncated] = useState(false)

    const setTruncation = () => {
        setIsTruncated(shouldTruncate(textRef.current))
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    ref={textRef}
                    className={cn('block truncate', className)}
                    onPointerEnter={setTruncation}
                    onFocus={setTruncation}
                >
                    {value}
                </span>
            </TooltipTrigger>
            {isTruncated && <TooltipContent>{value}</TooltipContent>}
        </Tooltip>
    )
}
