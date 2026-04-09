import { type Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { DataTableFacetedFilter } from '@/components/data-table/DataTableFacetedFilter'
import { DataTableViewOptions } from '@/components/data-table/DataTableViewOptions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import { Spinner } from '@/components/ui/spinner'
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
    const searchColumn = config.search?.columnId
        ? table.getColumn(config.search.columnId)
        : undefined
    const isExternalSearch = typeof config.search?.onChange === 'function'
    const searchValue = isExternalSearch
        ? (config.search?.value ?? '')
        : ((searchColumn?.getFilterValue() as string | undefined) ?? '')

    return (
        <div className="space-y-2">
            {/* search bar, view options, & actions (large screens) */}
            <div className="mb-0 flex items-center">
                <div className="min-w-0 flex-1">
                    {config.search && (
                        <div className="relative">
                            <Input
                                placeholder={config.search.placeholder}
                                value={searchValue}
                                onChange={(event) => {
                                    if (isExternalSearch) {
                                        config.search?.onChange?.(
                                            event.target.value
                                        )
                                        return
                                    }
                                    searchColumn?.setFilterValue(
                                        event.target.value
                                    )
                                }}
                                className={`${config.search.className ?? 'h-8 w-full'} ${config.search.isLoading ? 'pr-8' : ''}`}
                            />
                            {config.search.isLoading && (
                                <Spinner className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground" />
                            )}
                        </div>
                    )}
                </div>
                {(config.showViewOptions ?? true) && (
                    <div className="ms-2">
                        <DataTableViewOptions table={table} />
                    </div>
                )}
                {config.actions && (
                    <div className="ms-2! ml-auto hidden items-center gap-2 sm:flex">
                        {config.actions.map((action, index) => (
                            <Button
                                key={index}
                                size="sm"
                                variant={action.variant ?? 'default'}
                                onClick={() => void action.onClick()}
                            >
                                {action.icon && (
                                    <action.icon className="size-4" />
                                )}
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* filters & reset */}
            {hasSecondaryControls && (
                <div className="mt-2 mb-0 flex flex-wrap items-center gap-2">
                    {config.filters?.map((filter) => {
                        const column = table.getColumn(filter.columnId)
                        return column ? (
                            <DataTableFacetedFilter
                                key={filter.columnId}
                                title={filter.title}
                                column={column}
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

            {/* actions (small screens) */}
            {config.actions && (
                <div className="mt-2 flex gap-2 sm:hidden">
                    {config.actions.map((action, index) => (
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
            )}
        </div>
    )
}
