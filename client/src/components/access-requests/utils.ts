import {
    type AccessRequestPublic,
    AccessRequestService,
    type UpdateAccessRequestStatusRequest,
    type UserPublic,
} from '@/api/generated'
import { AccessRequestStatusSchema } from '@/api/generated/schemas.gen'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { greenText, redText } from '@/lib/styles'
import type { FilterOption, MenuItemConfig } from '@/models/data-table'
import { Check, X } from 'lucide-react'

export function getStatusFilterOptions(): FilterOption[] {
    return AccessRequestStatusSchema.enum.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
    }))
}

export const updateAccessRequestStatus = async (
    request: AccessRequestPublic,
    action: UpdateAccessRequestStatusRequest['status'],
    user: UserPublic | null,
    onRequestUpdated: (request: AccessRequestPublic) => void,
    onReloadRequests: () => Promise<void>
) => {
    const { error } = await AccessRequestService.updateAccessRequestStatus({
        path: {
            access_request_id: request.id,
        },
        body: {
            status: action,
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
        status: action,
        reviewed_at: date,
        reviewer: user,
        updated_at: date,
    }
    onRequestUpdated(updatedRequest)
}

export const getAccessRequestRowActions = (
    row: AccessRequestPublic,
    isRowLoading: boolean,
    openConfirmDialog: (
        request: AccessRequestPublic,
        action: UpdateAccessRequestStatusRequest['status']
    ) => void
): MenuItemConfig[] => {
    if (row.status !== 'pending') return []
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
}
