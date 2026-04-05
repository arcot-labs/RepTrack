import { type Row } from '@tanstack/react-table'

import { Button } from '@/components/ui/overrides/button'
import type { DataTableRowActionsConfig } from '@/models/data-table'

interface DataTableInlineRowActionsProps<TData> {
    row: Row<TData>
    config: DataTableRowActionsConfig<TData>
}

export function DataTableInlineRowActions<TData>({
    row,
    config,
}: DataTableInlineRowActionsProps<TData>) {
    const rowData = config.schema.parse(row.original)
    const menuItems = config.menuItems(rowData as TData)

    return (
        <div className="flex items-center justify-center gap-1">
            {menuItems.map((item, index) => {
                if (item.type === 'separator' || item.type === 'radio-group')
                    throw Error(
                        'DataTableInlineRowActions does not support separator or radio-group menu items'
                    )

                // action
                return (
                    <Button
                        key={index}
                        size="xs"
                        variant="outline"
                        className={`${item.className ?? ''} h-7`}
                        onClick={() => void item.onSelect?.(rowData)}
                        disabled={item.disabled}
                    >
                        {item.icon && <item.icon className="size-4" />}
                        {item.label}
                    </Button>
                )
            })}
        </div>
    )
}
