import { type Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/overrides/button'
import type { DataTableRowActionsConfig } from '@/models/data-table'

interface DataTableRowActionsProps<TData> {
    row: Row<TData>
    config: DataTableRowActionsConfig<TData>
}

export function DataTableRowActions<TData>({
    row,
    config,
}: DataTableRowActionsProps<TData>) {
    const rowData = config.schema.parse(row.original)
    const menuItems = config.menuItems(rowData as TData)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 data-[state=open]:bg-muted"
                >
                    <MoreHorizontal />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                {menuItems.map((item, index) => {
                    if (item.type === 'separator')
                        return <DropdownMenuSeparator key={index} />

                    if (item.type === 'radio-group' && item.options) {
                        return (
                            <DropdownMenuSub key={index}>
                                <DropdownMenuSubTrigger>
                                    {item.label}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={item.value}>
                                        {item.options.map((option) => (
                                            <DropdownMenuRadioItem
                                                key={option.value}
                                                value={option.value}
                                                onSelect={() =>
                                                    void item.onSelect?.(
                                                        rowData
                                                    )
                                                }
                                            >
                                                {option.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        )
                    }

                    // action
                    return (
                        <DropdownMenuItem
                            key={index}
                            className={item.className}
                            onSelect={() => void item.onSelect?.(rowData)}
                            disabled={item.disabled}
                        >
                            {item.icon && <item.icon className="mr-2 size-4" />}
                            {item.label}
                            {item.shortcut && (
                                <DropdownMenuShortcut>
                                    {item.shortcut}
                                </DropdownMenuShortcut>
                            )}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
