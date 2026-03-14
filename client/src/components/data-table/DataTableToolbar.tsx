import { type Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { DataTableFacetedFilter } from '@/components/data-table/DataTableFacetedFilter'
import { DataTableViewOptions } from '@/components/data-table/DataTableViewOptions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import type { DataTableToolbarConfig } from '@/models/data-table'

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    config: DataTableToolbarConfig
}

export function DataTableToolbar<TData>({
    table,
    config,
}: DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-2">
                {config.search && (
                    <Input
                        placeholder={config.search.placeholder}
                        value={
                            table
                                .getColumn(config.search.columnId)
                                ?.getFilterValue() as string
                        }
                        onChange={(event) =>
                            table
                                // @ts-expect-error searchConfig is defined
                                .getColumn(config.search.columnId)
                                ?.setFilterValue(event.target.value)
                        }
                        className={
                            config.search.className ?? 'h-8 w-37.5 lg:w-62.5'
                        }
                    />
                )}
                {config.filters?.map((filter) => {
                    const column = table.getColumn(filter.columnId)
                    return column ? (
                        <DataTableFacetedFilter
                            key={filter.columnId}
                            column={column}
                            title={filter.title}
                            options={filter.options}
                        />
                    ) : null
                })}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            table.resetColumnFilters()
                        }}
                    >
                        Reset
                        <X />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                {(config.showViewOptions ?? true) && (
                    <DataTableViewOptions table={table} />
                )}
                {config.actions?.map((action, index) => (
                    <Button
                        key={index}
                        size="sm"
                        variant={action.variant ?? 'default'}
                        onClick={() => void action.onClick()}
                    >
                        {action.icon && <action.icon className="size-4" />}
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
