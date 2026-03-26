import { AccessRequestService } from '@/api/generated'
import { AccessRequestStatusSchema } from '@/api/generated/schemas.gen'
import type {
    AccessRequestPublic,
    AccessRequestStatus,
} from '@/api/generated/types.gen'
import { zAccessRequestPublic } from '@/api/generated/zod.gen'
import { useSession } from '@/auth/session'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/overrides/button'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import {
    blueText,
    greenText,
    lightBlueBackground,
    lightGreenBackground,
    lightRedBackground,
    redText,
} from '@/lib/styles'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Check, X } from 'lucide-react'
import { useState } from 'react'

const blueBadgeClassName = `${lightBlueBackground} ${blueText}`
const greenBadgeClassName = `${lightGreenBackground} ${greenText}`
const redBadgeClassName = `${lightRedBackground} ${redText}`

function StatusBadge({ status }: { status: AccessRequestStatus }) {
    switch (status) {
        case 'pending':
            return <Badge className={blueBadgeClassName}>Pending</Badge>
        case 'approved':
            return <Badge className={greenBadgeClassName}>Approved</Badge>
        case 'rejected':
            return <Badge className={redBadgeClassName}>Rejected</Badge>
    }
}

function getStatusFilterOptions(): FilterOption[] {
    return AccessRequestStatusSchema.enum.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
    }))
}

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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
    const [isLoadingRequestIds, setIsLoadingRequestIds] = useState<Set<number>>(
        new Set()
    )
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean
        request: AccessRequestPublic | null
        action: 'approved' | 'rejected' | null
    }>({
        isOpen: false,
        request: null,
        action: null,
    })

    const openConfirmDialog = (
        request: AccessRequestPublic,
        action: 'approved' | 'rejected'
    ) => {
        setConfirmDialog({
            isOpen: true,
            request,
            action,
        })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog({
            isOpen: false,
            request: null,
            action: null,
        })
    }

    const handleConfirmAction = () => {
        if (confirmDialog.request && confirmDialog.action)
            void handleUpdateStatus(confirmDialog.request, confirmDialog.action)
        closeConfirmDialog()
    }

    const handleUpdateStatus = async (
        request: AccessRequestPublic,
        status: 'approved' | 'rejected'
    ) => {
        setIsLoadingRequestIds((prev) => new Set(prev).add(request.id))
        try {
            const { error } =
                await AccessRequestService.updateAccessRequestStatus({
                    path: {
                        access_request_id: request.id,
                    },
                    body: {
                        status: status,
                    },
                })
            if (error) {
                await handleApiError(error, {
                    httpErrorHandlers: {
                        access_request_not_pending: async () => {
                            notify.warning(
                                'Access request has already been reviewed. Reloading data'
                            )
                            await onReloadRequests()
                        },
                    },
                    fallbackMessage: 'Failed to update access request status',
                })
                return
            }
            notify.success('Access request status updated')
            const date = new Date().toISOString()
            const updatedRequest = {
                ...request,
                status,
                reviewed_at: date,
                reviewer: user,
                updated_at: date,
            }
            onRequestUpdated(updatedRequest)
        } finally {
            setIsLoadingRequestIds((prev) => {
                const next = new Set(prev)
                next.delete(request.id)
                return next
            })
        }
    }

    const rowActionsConfig: DataTableRowActionsConfig<AccessRequestPublic> = {
        schema: zAccessRequestPublic,
        menuItems: (row) => {
            if (row.status !== 'pending') return []

            const isRowLoading = isLoadingRequestIds.has(row.id)
            return [
                {
                    type: 'action',
                    className: greenText,
                    icon: Check,
                    onSelect: () => {
                        openConfirmDialog(row, 'approved')
                    },
                    disabled: isRowLoading,
                },
                {
                    type: 'action',
                    className: redText,
                    icon: X,
                    onSelect: () => {
                        openConfirmDialog(row, 'rejected')
                    },
                    disabled: isRowLoading,
                },
            ]
        },
    }

    const columns: ColumnDef<AccessRequestPublic>[] = [
        {
            id: 'name',
            accessorFn: (row) => `${row.first_name} ${row.last_name}`,
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Email" />
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
                    <div className="text-center">—</div>
                )
            },
            enableHiding: false,
        },
        {
            accessorKey: 'reviewer.username',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Reviewed By" />
            ),
            cell: ({ row }) =>
                row.original.reviewer ? row.original.reviewer.username : '—',
            enableHiding: false,
        },
        {
            accessorKey: 'reviewed_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Reviewed At" />
            ),
            cell: ({ row }) =>
                row.original.reviewed_at
                    ? new Date(row.original.reviewed_at).toLocaleString()
                    : '—',
            enableHiding: false,
        },
        {
            accessorKey: 'updated_at',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated At" />
            ),
            cell: ({ row }) =>
                new Date(row.original.updated_at).toLocaleString(),
            enableHiding: false,
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
        showViewOptions: false,
    }

    return (
        <>
            <DataTable
                data={requests}
                columns={columns}
                pageSize={5}
                isLoading={isLoading}
                toolbarConfig={toolbarConfig}
            />
            <Dialog
                open={confirmDialog.isOpen}
                onOpenChange={(isOpen) => {
                    setConfirmDialog({ ...confirmDialog, isOpen })
                }}
            >
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog.action === 'approved'
                                ? 'Approve Request'
                                : 'Reject Request'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                        Are you sure you want to{' '}
                        <span className="font-semibold">
                            {confirmDialog.action === 'approved'
                                ? 'approve'
                                : 'reject'}
                        </span>{' '}
                        this access request for{' '}
                        <span className="font-semibold">
                            {confirmDialog.request?.first_name}{' '}
                            {confirmDialog.request?.last_name}
                        </span>
                        ?
                        <div className="mt-2">This action is irreversible.</div>
                    </div>
                    <DialogFooter>
                        <Button onClick={closeConfirmDialog}>Cancel</Button>
                        <Button
                            onClick={handleConfirmAction}
                            variant={
                                confirmDialog.action === 'approved'
                                    ? 'success'
                                    : 'destructive'
                            }
                        >
                            {confirmDialog.action === 'approved'
                                ? 'Approve'
                                : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
