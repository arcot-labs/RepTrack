# Reusable Data Table Component

A fully reusable data table component built with TanStack Table (React Table v8) and shadcn/ui. This component is designed to handle any type of data with customizable toolbars, filters, search, and row actions.

## Features

- Fully type-safe with TypeScript generics
- Configurable toolbar with search, filters, and actions
- Customizable row actions menu
- Built-in pagination, sorting, and filtering
- Column visibility controls
- Row selection support
- Responsive design

## API Reference

See component files for Props (e.g., `DataTable.tsx`)

See `data-table.ts` for config types & interfaces

## Basic Usage

### 1. Define Data Type

```typescript
import { z } from 'zod'

export const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    status: z.string(),
})

export type User = z.infer<typeof userSchema>

const users: User[] = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        status: 'active',
    },
    // ... more users
]
```

### 2. Define Table Columns

```typescript
import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableRowActions } from '@/components/data-table/DataTableRowActions'
import { Checkbox } from '@/components/ui/checkbox'

export const columns: ColumnDef<User>[] = [
    // selection column
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    // data columns
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
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
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'status',
        meta: { viewLabel: 'Status' },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
        ),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    // actions column
    {
        id: 'actions',
        cell: ({ row }) => <DataTableRowActions row={row} config={userRowActionsConfig} />,
    },
]

// To customize labels shown in the "View" column toggle menu,
// set `meta.viewLabel` on each column definition.
//
// To use a column purely for filtering (hidden, not in View options),
// set `meta.filterOnly: true`.
// Pass its id with `false` via `initialColumnVisibility` on <DataTable>.
//
// Example:
//   { id: 'role', meta: { filterOnly: true }, accessorFn: ..., filterFn: ... }
//   <DataTable ... initialColumnVisibility={{ role: false }} />
```

### 3. Configure Toolbar

```typescript
import type { DataTableToolbarConfig } from '@/models/data-table'
import { Shield, User as UserIcon } from 'lucide-react'

export const userToolbarConfig: DataTableToolbarConfig = {
    // search configuration
    search: {
        columnId: 'name',
        placeholder: 'Search users...',
        className: 'h-8 w-[150px] lg:w-[250px]',
    },

    // filter configurations
    filters: [
        {
            columnId: 'role',
            title: 'Role',
            options: [
                { label: 'Admin', value: 'admin', icon: Shield },
                { label: 'User', value: 'user', icon: UserIcon },
            ],
        },
        {
            columnId: 'status',
            title: 'Status',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
            ],
        },
    ],

    // show column visibility controls
    showViewOptions: true,

    // toolbar actions
    actions: [
        {
            label: 'Add User',
            onClick: () => {
                // handle add user
                console.log('Add new user')
            },
            variant: 'default',
        },
    ],
}
```

### 4. Configure Row Actions

```typescript
import type { DataTableRowActionsConfig } from '@/models/data-table'

export const userRowActionsConfig: DataTableRowActionsConfig<User> = {
    schema: userSchema,
    menuItems: (user) => [
        {
            type: 'action',
            label: 'View Details',
            onSelect: (data) => {
                console.log('View user:', data)
            },
        },
        {
            type: 'action',
            label: 'Edit',
            onSelect: (data) => {
                console.log('Edit user:', data)
            },
        },
        {
            type: 'separator',
            label: '',
        },
        {
            type: 'radio-group',
            label: 'Change Role',
            value: user.role,
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
            ],
            onSelect: (data) => {
                console.log('Update role:', data)
            },
        },
        {
            type: 'separator',
            label: '',
        },
        {
            type: 'action',
            label: 'Delete',
            shortcut: '⌘⌫',
            onSelect: (data) => {
                console.log('Delete user:', data)
            },
        },
    ],
}
```

### 5. Use the DataTable Component

```typescript
import { DataTable } from '@/components/data-table/DataTable'

export function UsersPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Users</h1>
            <DataTable
                data={users}
                columns={columns}
                toolbarConfig={userToolbarConfig}
                pageSize={25}
                isLoading={false}
            />
        </div>
    )
}
```

## See Also

- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
