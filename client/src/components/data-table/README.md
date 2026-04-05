# Reusable Data Table Component

A domain-agnostic, fully typed, TanStack Table (React Table v8) wrapper that layers shadcn/ui toolbar controls, pagination, filters, and row actions on top of every slice of data you need to show. It owns the configuration for sorting, filters, selection, responsive column hiding, and loading states so consuming pages never have to duplicate that logic.

## Key features

- **Full TanStack Table wiring** with sorting, filtering, pagination, faceting, and controlled visibility state.
- **Toolbar with search, faceted filters, reset, view options, and custom actions.** Search can be wired to either a column filter or an external search hook; filters render badges for selected values and keep counts up to date.
- **Column-centric helpers** like `DataTableColumnHeader`, `DataTableViewOptions`, and `DataTableTruncatedCell` so each cell/header keeps its behavior declarative.
- **Row action helpers** that accept a Zod schema to parse/validate row data before calling action handlers, supporting dropdown menus or inline button lists.
- **Skeleton, pagination, and empty-state handling** that match the rest of the UI kit so pages never render partial tables when loading.
- **Selection utilities** (e.g., `createSelectColumn`) and responsive column hiding via `meta.hideOnBelowMd`.

## `<DataTable>` overview

`DataTable<TData, TValue>` is the only component most pages need to import. It renders the toolbar, table body, pagination footer, and loading skeleton automatically.

```tsx
<DataTable
    data={data}
    columns={columns}
    toolbarConfig={toolbarConfig}
    pageSize={25}
    isLoading={isLoading}
/>
```

| Prop                      | Description                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                    | Array of row data.                                                                                                                                                                                         |
| `columns`                 | `ColumnDef` array (TanStack Table). Use helpers such as `DataTableColumnHeader`, `DataTableTruncatedCell`, `createSelectColumn`, and the row action components to keep your column definitions consistent. |
| `initialColumnVisibility` | Optional visibility state. Falls back to responsive defaults that hide columns marked with `meta.hideOnBelowMd` when the viewport is narrower than 768px unless view options have been disabled.           |
| `edgePaddingConfig`       | Controls which columns receive `pl-4`/`pr-4`; defaults to excluding the `actions` column so buttons align with the border.                                                                                 |
| `toolbarConfig`           | Optional toolbar configuration (`DataTableToolbarConfig`).                                                                                                                                                 |
| `pageSize`                | Initial page size (default: 10).                                                                                                                                                                           |
| `isLoading`               | Toggles `DataTableSkeleton` while still rendering the pagination footer.                                                                                                                                   |

When `toolbarConfig` is provided, the toolbar renders:

- A search box wired to `search.columnId`; attaching `search.onChange`/`search.value` allows you to control the search externally without mutating column filters.
- The view options trigger (unless `showViewOptions` is `false`) listing every column that can hide.
- Toolbar actions, displayed inline on larger breakpoints and stacked on mobile.
- Faceted filter buttons plus a Reset button whenever filters are configured or table state is filtered.

## Column definitions and metadata

Use standard TanStack `ColumnDef` definitions. The helpers in this folder keep column behavior consistent.

- **`DataTableColumnHeader`** renders the dropdown for sorting, clearing, and hiding for sortable/hideable columns.
- **`DataTableTruncatedCell`** wraps a string in a tooltip and only shows it when the text actually truncates.
- **`DataTableColumnMeta`** (pass to `columnDef.meta`) supports:
    - `viewLabel` – overrides the label shown in the view options menu.
    - `filterOnly` – keeps a column in filters/search logic without showing it in the view menu.
    - `hideOnBelowMd` – automatically hides the column on screens narrower than 768px when view toggles are enabled.
    - `headerClassName` / `cellClassName` – custom classes applied after the edge padding calculations.

Other helpers:

- **`createSelectColumn()`** adds the checkbox selection column used by any table that needs multi-row actions.
- **`DataTableInlineRowActions`** renders inline buttons for action-only menus (does not support separators or radio groups).
- **`DataTableRowActions`** renders the full dropdown menu used for complex actions.

## `DataTableToolbarConfig`

```ts
export interface DataTableToolbarConfig {
    search?: {
        columnId?: string
        placeholder: string
        className?: string
        value?: string
        onChange?: (value: string) => void
        isLoading?: boolean
    }
    filters?: Array<{
        columnId: string
        title: string
        options: FilterOption[]
    }>
    showViewOptions?: boolean
    actions?: Array<{
        label: string
        onClick: () => void | Promise<void>
        variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
        icon?: ComponentType<{ className?: string }>
    }>
}
```

- **Filters** render `DataTableFacetedFilter` popovers that display counts, selected badge chips, and a clear button when filters are active.
- **Actions** render responsive buttons; large screens show them to the right of the search, smaller screens stack them below the filters.
- **`search`** defaults to the column filter but can be wired to external state by supplying `value`/`onChange`.
- **`showViewOptions`** defaults to `true`; disabling it also disables the responsive hiding logic described above.

## Row actions configuration

Row actions are backed by `DataTableRowActionsConfig`.

```ts
export interface DataTableRowActionsConfig<TData = unknown> {
    schema: ZodType
    menuItems: (row: TData) => MenuItemConfig[]
}
```

`MenuItemConfig` variants:

- `type: 'action'` – regular dropdown item with optional icon, shortcut, disabled flag, and `onSelect` callback.
- `type: 'separator'` – renders a divider line.
- `type: 'radio-group'` – renders a submenu with radio items; selecting one calls `onSelect` with the parsed row.

`DataTableRowActions` (dropdown) and `DataTableInlineRowActions` both parse the row through `schema` before invoking `onSelect`, so your handlers always receive sanitized data.

## Loading, empty, and pagination states

- Setting `isLoading` to `true` renders `DataTableSkeleton`, a five-row placeholder that mirrors the current column count while still displaying the pagination footer.
- If filtering removes all rows, the table renders a single row with the “No results” message that spans all columns.
- The pagination footer (`DataTablePagination`) shows page counts, row ranges, selectable page sizes (5, 10, 25, 50), navigation buttons, and—if a selection column exists—the number of rows currently selected in the filtered set.

## Example columns / usage

```tsx
import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableRowActions } from '@/components/data-table/DataTableRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { createSelectColumn } from '@/components/data-table/DataTableSelectColumn'
import type { User } from './types'

const rowActionsConfig = {
    schema: userSchema,
    menuItems: (user) => [
        {
            type: 'action',
            label: 'Details',
            onSelect: (row) => console.log(row),
        },
        { type: 'separator' },
        {
            type: 'radio-group',
            label: 'Role',
            value: user.role,
            options: [
                { value: 'admin', label: 'Admin' },
                { value: 'user', label: 'User' },
            ],
            onSelect: (row) => console.log(row),
        },
    ],
}

export const columns: ColumnDef<User>[] = [
    createSelectColumn(),
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
            <DataTableTruncatedCell
                value={row.getValue('name')}
                className="max-w-[120px]"
            />
        ),
        meta: {
            viewLabel: 'Full name',
            hideOnBelowMd: true,
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Role" />
        ),
        meta: { filterOnly: true },
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <DataTableRowActions row={row} config={rowActionsConfig} />
        ),
    },
]
```

Pair this with a `toolbarConfig` that defines search, filters, and toolbar actions, then render `<DataTable>` as described above.

## See also

- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
