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
    const hasSecondaryControls = (config.filters?.length ?? 0) > 0 || isFiltered
    const searchColumn = config.search
        ? table.getColumn(config.search.columnId)
        : undefined
    const searchValue =
        (searchColumn?.getFilterValue() as string | undefined) ?? ''

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    {config.search && (
                        <Input
                            placeholder={config.search.placeholder}
                            value={searchValue}
                            onChange={(event) =>
                                searchColumn?.setFilterValue(event.target.value)
                            }
                            className={config.search.className ?? 'h-8 w-full'}
                        />
                    )}
                </div>
                {(config.showViewOptions ?? true) && (
                    <DataTableViewOptions table={table} />
                )}
                <div className="ml-auto hidden items-center gap-2 sm:flex">
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
            {hasSecondaryControls && (
                <div className="flex flex-wrap items-center gap-2">
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
            )}
            <div className="flex gap-2 sm:hidden">
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
