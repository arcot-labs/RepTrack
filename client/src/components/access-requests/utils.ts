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
import { capitalizeWords } from '@/lib/text'
import type { FilterOption, MenuItemConfig } from '@/models/data-table'
import { Check, X } from 'lucide-react'

export const handleUpdate = async (
    request: AccessRequestPublic,
    action: UpdateAccessRequestStatusRequest['status'],
    user: UserPublic | null,
    onRequestUpdated: (request: AccessRequestPublic) => void,
    onReloadRequests: () => Promise<void>,
    setRowLoading: (requestId: number, isLoading: boolean) => void
) => {
    setRowLoading(request.id, true)
    try {
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
    } finally {
        setRowLoading(request.id, false)
    }
}

export const getAccessRequestRowActions = (
    request: AccessRequestPublic,
    isRowLoading: boolean,
    openConfirmDialog: (
        request: AccessRequestPublic,
        action: UpdateAccessRequestStatusRequest['status']
    ) => void
): MenuItemConfig[] => {
    if (request.status !== 'pending') return []
    return [
        {
            type: 'action',
            className: greenText,
            icon: Check,
            onSelect: () => {
                openConfirmDialog(request, 'approved')
            },
            disabled: isRowLoading,
        },
        {
            type: 'action',
            className: redText,
            icon: X,
            onSelect: () => {
                openConfirmDialog(request, 'rejected')
            },
            disabled: isRowLoading,
        },
    ]
}

export function getStatusFilterOptions(): FilterOption[] {
    return AccessRequestStatusSchema.enum.map((status) => ({
        label: capitalizeWords(status),
        value: status,
    }))
}
