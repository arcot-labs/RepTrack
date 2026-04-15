import { useState } from 'react'

interface DialogState<TPayload> {
    isOpen: boolean
    payload: TPayload | null
}

export function useDialog<TPayload>(
    onConfirm: (payload: TPayload) => Promise<void>
) {
    const [state, setState] = useState<DialogState<TPayload>>({
        isOpen: false,
        payload: null,
    })

    const open = (payload: TPayload) => {
        setState({
            isOpen: true,
            payload,
        })
    }

    const close = () => {
        setState((prev) => ({ ...prev, isOpen: false }))
    }

    const confirm = async () => {
        if (state.payload !== null) await onConfirm(state.payload)
        close()
    }

    return {
        state,
        open,
        close,
        confirm,
    }
}

interface ActionDialogState<TPayload, TAction> {
    isOpen: boolean
    payload: TPayload | null
    action: TAction | null
}

export function useActionDialog<TPayload, TAction>(
    onConfirm: (payload: TPayload, action: TAction) => Promise<void>
) {
    const [state, setState] = useState<ActionDialogState<TPayload, TAction>>({
        isOpen: false,
        payload: null,
        action: null,
    })

    const open = (payload: TPayload, action: TAction) => {
        setState({
            isOpen: true,
            payload,
            action,
        })
    }

    const close = () => {
        setState((prev) => ({ ...prev, isOpen: false }))
    }

    const confirm = async () => {
        if (state.payload !== null && state.action !== null)
            await onConfirm(state.payload, state.action)
        close()
    }

    return {
        state,
        open,
        close,
        confirm,
    }
}
