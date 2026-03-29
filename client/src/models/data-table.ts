import type { ComponentType } from 'react'
import type { ZodType } from 'zod'

interface DataTableSearchConfig {
    columnId: string
    placeholder: string
    className?: string
    // for external search
    value?: string
    onChange?: (value: string) => void
    isLoading?: boolean
}

export interface FilterOption {
    label: string
    value: string
    icon?: ComponentType<{ className?: string }>
}

interface DataTableFilterConfig {
    columnId: string
    title: string
    options: FilterOption[]
}

interface DataTableToolbarAction {
    label: string
    onClick: () => void | Promise<void>
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
    icon?: ComponentType<{ className?: string }>
}

export interface DataTableToolbarConfig {
    search?: DataTableSearchConfig
    filters?: DataTableFilterConfig[]
    showViewOptions?: boolean
    actions?: DataTableToolbarAction[]
}

type MenuItemType = 'separator' | 'radio-group' | 'action'

interface MenuItemConfig {
    type: MenuItemType
    label?: string
    shortcut?: string
    value?: string
    options?: { value: string; label: string }[]
    className?: string
    icon?: ComponentType<{ className?: string }>
    onSelect?: (rowData: unknown) => void | Promise<void>
    disabled?: boolean
}

export interface DataTableRowActionsConfig<TData = unknown> {
    schema: ZodType
    menuItems: (row: TData) => MenuItemConfig[]
}
