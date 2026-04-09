import type { UserPublic } from '@/api/generated/types.gen'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { Badge } from '@/components/ui/badge'
import {
    blueText,
    greenText,
    lightBlueBackground,
    lightGreenBackground,
} from '@/lib/styles'
import type { DataTableToolbarConfig, FilterOption } from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'

const blueBadgeClassName = `${lightBlueBackground} ${blueText}`
const greenBadgeClassName = `${lightGreenBackground} ${greenText}`

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
    if (isAdmin) {
        return <Badge className={greenBadgeClassName}>Admin</Badge>
    }
    return <Badge className={blueBadgeClassName}>User</Badge>
}

function getRoleFilterOptions(): FilterOption[] {
    return [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
    ]
}

const columns: ColumnDef<UserPublic>[] = [
    {
        id: 'name',
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'username',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Username" />
        ),
        enableHiding: false,
    },
    {
        accessorKey: 'email',
        meta: { hideOnBelowMd: true },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
        enableHiding: true,
    },
    {
        id: 'role',
        accessorFn: (row) => (row.is_admin ? 'admin' : 'user'),
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => {
            return (
                <div className="-ml-2">
                    <RoleBadge isAdmin={row.original.is_admin} />
                </div>
            )
        },
        filterFn: (row, id, filterValues: string[]) => {
            return filterValues.includes(row.getValue(id))
        },
        enableHiding: false,
    },
    {
        accessorKey: 'created_at',
        meta: { hideOnBelowMd: true },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
        enableHiding: true,
    },
    {
        accessorKey: 'updated_at',
        meta: { hideOnBelowMd: true },
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Updated At" />
        ),
        cell: ({ row }) => new Date(row.original.updated_at).toLocaleString(),
        enableHiding: true,
    },
]

const toolbarConfig: DataTableToolbarConfig = {
    search: {
        columnId: 'name',
        placeholder: 'Filter by name...',
    },
    filters: [
        {
            columnId: 'role',
            title: 'Role',
            options: getRoleFilterOptions(),
        },
    ],
    showViewOptions: true,
}

interface UsersTableProps {
    users: UserPublic[]
    isLoading: boolean
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
    return (
        <DataTable
            data={users}
            columns={columns}
            toolbarConfig={toolbarConfig}
            pageSize={5}
            isLoading={isLoading}
        />
    )
}
