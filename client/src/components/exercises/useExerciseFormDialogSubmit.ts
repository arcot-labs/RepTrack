import { ExerciseService, type ExercisePublic } from '@/api/generated'
import {
    zCreateExerciseRequest,
    zUpdateExerciseRequest,
} from '@/api/generated/zod.gen'
import { getExerciseUpdateBody } from '@/components/exercises/utils'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { preprocessTrim } from '@/lib/validation'
import type { ExerciseFormDialogMode } from '@/models/exercises-table'
import type { BaseSyntheticEvent } from 'react'
import type {
    FieldNamesMarkedBoolean,
    UseFormHandleSubmit,
    UseFormResetField,
} from 'react-hook-form'
import { z } from 'zod'

export const createExerciseFormSchema = z.object({
    name: preprocessTrim(zCreateExerciseRequest.shape.name),
    description: preprocessTrim(zCreateExerciseRequest.shape.description),
    muscle_group_ids: zCreateExerciseRequest.shape.muscle_group_ids,
})

export const updateExerciseFormSchema = z.object({
    name: preprocessTrim(zUpdateExerciseRequest.shape.name),
    description: preprocessTrim(zUpdateExerciseRequest.shape.description),
    muscle_group_ids: zUpdateExerciseRequest.shape.muscle_group_ids,
})

export type CreateExerciseForm = z.infer<typeof createExerciseFormSchema>
export type CreateExerciseFormInput = z.input<typeof createExerciseFormSchema>

export type UpdateExerciseForm = z.infer<typeof updateExerciseFormSchema>

export const defaultExerciseFormValues: CreateExerciseFormInput = {
    name: '',
    description: '',
    muscle_group_ids: [],
}

interface UseExerciseFormDialogSubmitParams {
    mode: ExerciseFormDialogMode
    exercise: ExercisePublic | null
    isDirty: boolean
    dirtyFields: FieldNamesMarkedBoolean<CreateExerciseFormInput>
    handleSubmit: UseFormHandleSubmit<
        CreateExerciseFormInput,
        CreateExerciseForm
    >
    resetField: UseFormResetField<CreateExerciseFormInput>
    closeDialog: () => void
    onSuccess: () => Promise<void>
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
    onRowLoadingChange: (exerciseId: number, loading: boolean) => void
}

interface UseExerciseFormDialogSubmitResult {
    submitForm: (event?: BaseSyntheticEvent) => Promise<void>
}

export function useExerciseFormDialogSubmit({
    mode,
    exercise,
    isDirty,
    dirtyFields,
    handleSubmit,
    resetField,
    closeDialog,
    onSuccess,
    onReloadExercises,
    onReloadMuscleGroups,
    onRowLoadingChange,
}: UseExerciseFormDialogSubmitParams): UseExerciseFormDialogSubmitResult {
    const sharedErrorHandlers = {
        muscle_group_not_found: async () => {
            notify.error('Invalid muscle group selected. Reloading data')
            await onReloadMuscleGroups()
        },
        exercise_name_conflict: () => {
            notify.error('An exercise with that name already exists')
            resetField('name')
        },
    }

    const onSubmitCreateForm = async (form: CreateExerciseForm) => {
        const { error } = await ExerciseService.createExercise({
            body: createExerciseFormSchema.parse(form),
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: sharedErrorHandlers,
                fallbackMessage: 'Failed to create exercise',
            })
            return
        }
        notify.success('Exercise created')
        await onSuccess()
        closeDialog()
    }

    const onSubmitEditForm = async (form: CreateExerciseForm) => {
        if (!exercise) {
            notify.error('Exercise data is missing. Try again')
            closeDialog()
            return
        }

        if (!isDirty) {
            notify.warning('No changes to save')
            closeDialog()
            return
        }

        const parsedForm = updateExerciseFormSchema.parse(form)
        const body: Partial<UpdateExerciseForm> = getExerciseUpdateBody(
            dirtyFields,
            parsedForm
        )

        onRowLoadingChange(exercise.id, true)
        try {
            const { error } = await ExerciseService.updateExercise({
                path: { exercise_id: exercise.id },
                body,
            })
            if (error) {
                await handleApiError(error, {
                    httpErrorHandlers: {
                        exercise_not_found: async () => {
                            notify.error('Exercise not found. Reloading data')
                            closeDialog()
                            await onReloadExercises()
                        },
                        ...sharedErrorHandlers,
                    },
                    fallbackMessage: 'Failed to update exercise',
                })
                return
            }
            notify.success('Exercise updated')
            await onSuccess()
            closeDialog()
        } finally {
            onRowLoadingChange(exercise.id, false)
        }
    }

    return {
        submitForm: handleSubmit(
            mode === 'create' ? onSubmitCreateForm : onSubmitEditForm
        ),
    }
}
