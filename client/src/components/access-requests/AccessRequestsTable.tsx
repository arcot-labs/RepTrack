import type {
    AccessRequestPublic,
    UpdateAccessRequestStatusRequest,
} from '@/api/generated/types.gen'
import { zAccessRequestPublic } from '@/api/generated/zod.gen'
import { useSession } from '@/auth/session'
import { StatusBadge } from '@/components/access-requests/StatusBadge'
import {
    getAccessRequestRowActions,
    getStatusFilterOptions,
    handleUpdate,
} from '@/components/access-requests/utils'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { useRowLoading } from '@/components/data-table/rowLoading'
import { useActionDialog } from '@/components/dialog'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/overrides/button'
import { formatNullableDateTime } from '@/lib/datetime'
import { dash, formatNullableString } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'

interface AccessRequestsTableProps {
    requests: AccessRequestPublic[]
    isLoading: boolean
    onRequestUpdated: (request: AccessRequestPublic) => void
    onReloadRequests: () => Promise<void>
}

export function AccessRequestsTable({
    requests,
    isLoading,
    onRequestUpdated,
    onReloadRequests,
}: AccessRequestsTableProps) {
    const { user } = useSession()
    const { isRowLoading, setRowLoading } = useRowLoading<number>()
    const confirmDialog = useActionDialog<
        AccessRequestPublic,
        UpdateAccessRequestStatusRequest['status']
    >(async (request, action) => {
        await handleUpdate(
            request,
            action,
            user,
            onRequestUpdated,
            onReloadRequests,
            setRowLoading
        )
    })

    const rowActionsConfig: DataTableRowActionsConfig<AccessRequestPublic> = {
        schema: zAccessRequestPublic,
        menuItems: (row) => {
            return getAccessRequestRowActions(
                row,
                isRowLoading(row.id),
                confirmDialog.open
            )
        },
    }

    const columns: ColumnDef<AccessRequestPublic>[] = [
        {
            id: 'actions',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Actions"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => {
                const menuItems = rowActionsConfig.menuItems(row.original)
                return menuItems.length > 0 ? (
                    <DataTableInlineRowActions
                        row={row}
                        config={rowActionsConfig}
                    />
                ) : (
                    <div className="text-center">{dash}</div>
                )
            },
            enableHiding: false,
        },
        {
            id: 'name',
            accessorFn: (row) => `${row.first_name} ${row.last_name}`,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                return (
                    <div className="-ml-2">
                        <StatusBadge status={row.original.status} />
                    </div>
                )
            },
            filterFn: (row, id, value: string[]) => {
                return value.includes(row.getValue(id))
            },
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
            accessorKey: 'reviewer.username',
            meta: {
                hideOnBelowMd: true,
                viewLabel: 'Reviewed By',
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Reviewed By" />
            ),
            cell: ({ row }) =>
                formatNullableString(row.original.reviewer?.username),
            enableHiding: true,
        },
        {
            accessorKey: 'reviewed_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Reviewed At" />
            ),
            cell: ({ row }) => formatNullableDateTime(row.original.reviewed_at),
            enableHiding: true,
        },
        {
            accessorKey: 'created_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created At" />
            ),
            cell: ({ row }) =>
                new Date(row.original.created_at).toLocaleString(),
            enableHiding: true,
        },
        {
            accessorKey: 'updated_at',
            meta: { hideOnBelowMd: true },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated At" />
            ),
            cell: ({ row }) =>
                new Date(row.original.updated_at).toLocaleString(),
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
                columnId: 'status',
                title: 'Status',
                options: getStatusFilterOptions(),
            },
        ],
        showViewOptions: true,
    }

    return (
        <>
            <DataTable
                data={requests}
                columns={columns}
                toolbarConfig={toolbarConfig}
                pageSize={5}
                isLoading={isLoading}
            />
            <Dialog
                open={confirmDialog.state.isOpen}
                onOpenChange={(isOpen) => {
                    if (isOpen) return
                    confirmDialog.close()
                }}
            >
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.state.action === 'approved'
                                ? 'Approve Request'
                                : 'Reject Request'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                        Are you sure you want to{' '}
                        <span className="font-semibold">
                            {confirmDialog.state.action === 'approved'
                                ? 'approve'
                                : 'reject'}
                        </span>{' '}
                        this access request for{' '}
                        <span className="font-semibold">
                            {confirmDialog.state.payload?.first_name}{' '}
                            {confirmDialog.state.payload?.last_name}
                        </span>
                        ?
                        <div className="mt-2">This action is irreversible.</div>
                    </div>
                    <DialogFooter>
                        <Button onClick={confirmDialog.close}>Cancel</Button>
                        <Button
                            onClick={() => {
                                void confirmDialog.confirm()
                            }}
                            variant={
                                confirmDialog.state.action === 'approved'
                                    ? 'success'
                                    : 'destructive'
                            }
                        >
                            {confirmDialog.state.action === 'approved'
                                ? 'Approve'
                                : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
