import type {
    AccessRequestPublic,
    UpdateAccessRequestStatusRequest,
} from '@/api/generated'
import { useState } from 'react'

interface ConfirmDialogState {
    isOpen: boolean
    request: AccessRequestPublic | null
    action: UpdateAccessRequestStatusRequest['status'] | null
}

export function useConfirmDialog(
    onConfirm: (
        request: AccessRequestPublic,
        action: UpdateAccessRequestStatusRequest['status']
    ) => Promise<void>
) {
    const [state, setState] = useState<ConfirmDialogState>({
        isOpen: false,
        request: null,
        action: null,
    })

    const open = (
        request: AccessRequestPublic,
        action: UpdateAccessRequestStatusRequest['status']
    ) => {
        setState({
            isOpen: true,
            request,
            action,
        })
    }

    const close = () => {
        setState((prev) => ({ ...prev, isOpen: false }))
    }

    const confirm = async () => {
        if (state.request && state.action)
            await onConfirm(state.request, state.action)
        close()
    }

    return {
        state,
        open,
        close,
        confirm,
    }
}
