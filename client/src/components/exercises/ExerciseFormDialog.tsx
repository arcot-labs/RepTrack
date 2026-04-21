import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { ExerciseMuscleGroupSelector } from '@/components/exercises/ExerciseMuscleGroupSelector'
import {
    createExerciseFormSchema,
    defaultExerciseFormValues,
    useExerciseFormDialogSubmit,
    type CreateExerciseForm,
    type CreateExerciseFormInput,
} from '@/components/exercises/useExerciseFormDialogSubmit'
import {
    formatExerciseName,
    getExerciseDialogLabels,
    getExerciseFormValues,
} from '@/components/exercises/utils'
import { FormField } from '@/components/FormField'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/overrides/button'
import { formatNullableDateTime } from '@/lib/datetime'
import { formatNullableString } from '@/lib/text'
import type { ExerciseFormDialogMode } from '@/models/exercises-table'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

interface ExerciseFormDialogProps {
    open: boolean
    mode: ExerciseFormDialogMode
    exercise: ExercisePublic | null
    muscleGroups: MuscleGroupPublic[]
    isRowLoading: boolean
    onOpenChange: (isOpen: boolean) => void
    onSuccess: () => Promise<void>
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
    onRowLoadingChange: (exerciseId: number, loading: boolean) => void
}

export function ExerciseFormDialog({
    open,
    mode,
    exercise,
    muscleGroups,
    isRowLoading,
    onOpenChange,
    onSuccess,
    onReloadExercises,
    onReloadMuscleGroups,
    onRowLoadingChange,
}: ExerciseFormDialogProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: {
            errors,
            isDirty,
            dirtyFields,
            isSubmitting: isFormSubmitting,
        },
        reset,
        resetField,
    } = useForm<CreateExerciseFormInput, unknown, CreateExerciseForm>({
        // future schema divergence may require separate forms
        resolver: zodResolver(createExerciseFormSchema),
        defaultValues: defaultExerciseFormValues,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const isCreateMode = mode === 'create'
    const isViewMode = mode === 'view'
    const isSubmitting = isFormSubmitting || isRowLoading
    const dialogLabels = getExerciseDialogLabels(mode)

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedMuscleGroupIds = watch('muscle_group_ids') ?? []
    const showTimestamps = exercise?.user_id !== null && !isCreateMode

    useEffect(() => {
        if (!open) return
        const values = getExerciseFormValues(mode, exercise)
        const options = {
            // use default as initial for dirty check
            keepDefaultValues: mode === 'create',
        }
        reset(values, options)
    }, [open, mode, exercise, reset])

    const closeDialog = () => {
        onOpenChange(false)
    }

    const attemptClose = () => {
        if (isSubmitting) return
        if (isDirty && !confirm('Discard changes?')) return
        closeDialog()
    }

    const preventDefaultAndAttemptClose = (event: {
        preventDefault: () => void
    }) => {
        event.preventDefault()
        attemptClose()
    }

    const handleSelectedMuscleGroupIdsChange = (muscleGroupIds: number[]) => {
        const options = {
            shouldDirty: true,
            shouldValidate: true,
        }
        setValue('muscle_group_ids', muscleGroupIds, options)
    }

    const { submitForm } = useExerciseFormDialogSubmit({
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
    })

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                // only triggered on close (open state controlled by parent)
                if (isOpen) return
                attemptClose()
            }}
        >
            <DialogContent
                aria-describedby={undefined}
                onPointerDownOutside={preventDefaultAndAttemptClose}
                onEscapeKeyDown={preventDefaultAndAttemptClose}
            >
                <DialogHeader>
                    <DialogTitle>{dialogLabels.title}</DialogTitle>
                    {!isViewMode && (
                        <DialogDescription>
                            Set exercise details and assign target muscle groups
                        </DialogDescription>
                    )}
                </DialogHeader>
                <form
                    id="exercise-form"
                    className="space-y-4"
                    onSubmit={(event) => {
                        void submitForm(event)
                    }}
                >
                    <FormField
                        label="Name"
                        htmlFor="exercise-name"
                        error={errors.name?.message}
                    >
                        {isViewMode ? (
                            <div className="text-sm text-muted-foreground">
                                {exercise && formatExerciseName(exercise)}
                            </div>
                        ) : (
                            <Input
                                id="exercise-name"
                                placeholder="e.g., Barbell Squat"
                                aria-invalid={!!errors.name}
                                {...register('name')}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Description"
                        htmlFor="exercise-description"
                        error={errors.description?.message}
                    >
                        {isViewMode ? (
                            <div className="text-sm text-muted-foreground">
                                {formatNullableString(exercise?.description)}
                            </div>
                        ) : (
                            <Input
                                id="exercise-description"
                                placeholder="e.g., Lower-body compound movement"
                                aria-invalid={!!errors.description}
                                {...register('description')}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Muscle Groups"
                        error={errors.muscle_group_ids?.message}
                    >
                        <ExerciseMuscleGroupSelector
                            open={open}
                            readOnly={isViewMode}
                            muscleGroups={muscleGroups}
                            selectedMuscleGroupIds={selectedMuscleGroupIds}
                            disabled={isSubmitting}
                            onSelectedMuscleGroupIdsChange={
                                handleSelectedMuscleGroupIdsChange
                            }
                        />
                    </FormField>
                    {showTimestamps && (
                        <>
                            <FormField label="Created">
                                <div className="text-sm text-muted-foreground">
                                    {formatNullableDateTime(
                                        exercise?.created_at
                                    )}
                                </div>
                            </FormField>
                            <FormField label="Last Updated">
                                <div className="text-sm text-muted-foreground">
                                    {formatNullableDateTime(
                                        exercise?.updated_at
                                    )}
                                </div>
                            </FormField>
                        </>
                    )}
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={preventDefaultAndAttemptClose}
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </Button>
                    </DialogClose>
                    {!isViewMode && (
                        <Button
                            form="exercise-form"
                            type="submit"
                            variant="success"
                            disabled={isSubmitting || !isDirty}
                        >
                            {isSubmitting
                                ? dialogLabels.submittingButtonText
                                : dialogLabels.submitButtonText}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
