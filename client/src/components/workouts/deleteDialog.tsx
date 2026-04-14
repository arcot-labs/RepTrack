import type { WorkoutBase } from '@/api/generated'
import { useState } from 'react'

interface DeleteDialogState {
    isOpen: boolean
    workout: WorkoutBase | null
}

export function useDeleteDialog(
    onDelete: (workout: WorkoutBase) => Promise<void>
) {
    const [state, setState] = useState<DeleteDialogState>({
        isOpen: false,
        workout: null,
    })

    const open = (workout: WorkoutBase) => {
        setState({
            isOpen: true,
            workout,
        })
    }

    const close = () => {
        setState((prev) => ({ ...prev, isOpen: false }))
    }

    const _delete = async () => {
        if (state.workout) await onDelete(state.workout)
        close()
    }

    return {
        state,
        open,
        close,
        delete: _delete,
    }
}
