import type { ExercisePublic } from '@/api/generated'

export type ExerciseFormDialogMode = 'create' | 'edit' | 'view'

export interface ExerciseFormDialogState {
    isOpen: boolean
    mode: ExerciseFormDialogMode
    exercise: ExercisePublic | null
}
