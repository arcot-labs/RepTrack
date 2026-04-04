import { type Column } from '@tanstack/react-table'
import { Check, PlusCircle } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/overrides/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface DataTableFacetedFilterProps<TData, TValue> {
    title: string
    column: Column<TData, TValue>
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

const toggleFilterValue = <TData, TValue>(
    isSelected: boolean,
    column: Column<TData, TValue>,
    value: string,
    selectedValues: Set<string>
) => {
    if (isSelected) selectedValues.delete(value)
    else selectedValues.add(value)

    const filterValues = Array.from(selectedValues)
    column.setFilterValue(filterValues.length ? filterValues : undefined)
}

export function DataTableFacetedFilter<TData, TValue>({
    title,
    column,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const facets = column.getFacetedUniqueValues()
    const selectedValues = new Set(column.getFilterValue() as string[])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-dashed"
                >
                    <PlusCircle />
                    {title}
                    {selectedValues.size > 0 && (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-2 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {/* selected (small screens) */}
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden gap-1 lg:flex">
                                {/* selected (large screens) */}
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) =>
                                            selectedValues.has(option.value)
                                        )
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-50 p-0" align="start">
                <Command>
                    <CommandInput placeholder={'Search...'} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(
                                    option.value
                                )
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            toggleFilterValue(
                                                isSelected,
                                                column,
                                                option.value,
                                                selectedValues
                                            )
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded-lg border',
                                                isSelected
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className="size-3.5 text-primary-foreground" />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="size-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                        <span className="ml-auto flex size-4 items-center justify-center font-mono text-xs text-muted-foreground">
                                            {facets.get(option.value) ?? 0}
                                        </span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => {
                                            column.setFilterValue(undefined)
                                        }}
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
