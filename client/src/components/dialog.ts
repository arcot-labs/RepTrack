import { useRef, useState } from 'react'

interface DialogState<TArgs extends unknown[]> {
    isOpen: boolean
    isConfirming: boolean
    args: TArgs | null
}

export function useDialog<TArgs extends unknown[]>(
    onConfirm: (...args: TArgs) => Promise<void>
) {
    const [state, setState] = useState<DialogState<TArgs>>({
        isOpen: false,
        isConfirming: false,
        args: null,
    })
    const isConfirmingRef = useRef(false)

    const open = (...args: TArgs) => {
        setState({
            isOpen: true,
            isConfirming: false,
            args,
        })
    }

    const close = () => {
        setState((prev) => ({ ...prev, isOpen: false }))
    }

    const confirm = async () => {
        if (isConfirmingRef.current || state.args === null) return

        isConfirmingRef.current = true
        setState((prev) => ({ ...prev, isConfirming: true }))

        try {
            await onConfirm(...state.args)
            close()
        } finally {
            isConfirmingRef.current = false
            setState((prev) => ({ ...prev, isConfirming: false }))
        }
    }

    return {
        state,
        open,
        close,
        confirm,
    }
}
