import {
    ExerciseService,
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import {
    zCreateExerciseRequest,
    zUpdateExerciseRequest,
} from '@/api/generated/zod.gen'
import { formatExerciseName } from '@/components/exercises/utils'
import { FormField } from '@/components/FormField'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Spinner } from '@/components/ui/spinner'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import { formatNullableDateTime } from '@/lib/datetime'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { capitalizeWords, dash, formatNullableString } from '@/lib/text'
import { preprocessTrim } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const createExerciseFormSchema = z.object({
    name: preprocessTrim(zCreateExerciseRequest.shape.name),
    description: preprocessTrim(zCreateExerciseRequest.shape.description),
    muscle_group_ids: zCreateExerciseRequest.shape.muscle_group_ids,
})

const updateExerciseFormSchema = z.object({
    name: preprocessTrim(zUpdateExerciseRequest.shape.name),
    description: preprocessTrim(zUpdateExerciseRequest.shape.description),
    muscle_group_ids: zUpdateExerciseRequest.shape.muscle_group_ids,
})

type CreateExerciseForm = z.infer<typeof createExerciseFormSchema>
type UpdateExerciseForm = z.infer<typeof updateExerciseFormSchema>

type CreateExerciseFormInput = z.input<typeof createExerciseFormSchema>
type ExerciseForm = CreateExerciseForm
type ExerciseFormInput = CreateExerciseFormInput

const defaultExerciseFormValues: ExerciseForm = {
    name: '',
    description: '',
    muscle_group_ids: [],
}

interface ExerciseFormDialogProps {
    open: boolean
    mode: 'create' | 'edit' | 'view'
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
    } = useForm<ExerciseFormInput, unknown, ExerciseForm>({
        resolver: zodResolver(createExerciseFormSchema),
        defaultValues: defaultExerciseFormValues,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const isCreateMode = mode === 'create'
    const isViewMode = mode === 'view'
    const isSubmitting = isFormSubmitting || isRowLoading
    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        displayedItems: displayedMuscleGroups,
    } = useRemoteSearch({
        items: muscleGroups,
        enabled: open && !isViewMode,
        fallbackMessage: 'Failed to search muscle groups',
        search: (query, limit) =>
            SearchService.searchMuscleGroups({
                body: {
                    query,
                    limit,
                },
            }),
        getItemId: (muscleGroup) => muscleGroup.id,
        getResultId: (searchResult) => searchResult.id,
    })

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedMuscleGroupIds = watch('muscle_group_ids') ?? []

    useEffect(() => {
        if (!open) return
        if (isCreateMode) {
            if (exercise) {
                // copy existing
                reset(
                    {
                        name: `${exercise.name} - copy`,
                        description: exercise.description,
                        muscle_group_ids: exercise.muscle_groups.map(
                            (mg) => mg.id
                        ),
                    },
                    {
                        // use default values as initial for dirty check
                        keepDefaultValues: true,
                    }
                )
                return
            }
            // create new
            reset(defaultExerciseFormValues)
            return
        }
        // edit or view existing
        if (!exercise) throw Error('Exercise data missing for edit/view mode')
        reset({
            name: exercise.name,
            description: exercise.description,
            muscle_group_ids: exercise.muscle_groups.map((mg) => mg.id),
        })
    }, [open, isCreateMode, exercise, reset])

    const attemptClose = () => {
        if (isSubmitting) return
        if (isDirty && !confirm('Discard changes?')) return
        close()
    }

    const close = () => {
        onOpenChange(false)
    }

    const toggleMuscleGroup = (muscleGroupId: number, checked: boolean) => {
        const selected = new Set(selectedMuscleGroupIds)

        if (checked) selected.add(muscleGroupId)
        else selected.delete(muscleGroupId)

        setValue('muscle_group_ids', Array.from(selected), {
            shouldDirty: true,
            shouldValidate: true,
        })
    }

    const onSubmitCreateForm = async (form: ExerciseForm) => {
        const { error } = await ExerciseService.createExercise({
            body: createExerciseFormSchema.parse(form),
        })
        if (error) {
            await handleApiError(error, {
                httpErrorHandlers: {
                    muscle_group_not_found: async () => {
                        notify.error(
                            'Invalid muscle group selected. Reloading data'
                        )
                        await onReloadMuscleGroups()
                    },
                    exercise_name_conflict: () => {
                        notify.error(
                            'An exercise with that name already exists'
                        )
                        resetField('name')
                    },
                },
                fallbackMessage: 'Failed to create exercise',
            })
            return
        }
        notify.success('Exercise created')
        await onSuccess()
        close()
    }

    const onSubmitEditForm = async (form: ExerciseForm) => {
        if (!exercise) {
            notify.error('Exercise data is missing. Try again')
            close()
            return
        }

        if (!isDirty) {
            notify.warning('No changes to save')
            close()
            return
        }

        const parsedForm = updateExerciseFormSchema.parse(form)

        const body: Partial<UpdateExerciseForm> = {}
        if (dirtyFields.name) body.name = parsedForm.name ?? ''
        if (dirtyFields.description)
            body.description = parsedForm.description ?? ''
        if (dirtyFields.muscle_group_ids)
            body.muscle_group_ids = parsedForm.muscle_group_ids ?? []

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
                            close()
                            await onReloadExercises()
                        },
                        muscle_group_not_found: async () => {
                            notify.error(
                                'Invalid muscle group selected. Reloading data'
                            )
                            await onReloadMuscleGroups()
                        },
                        exercise_name_conflict: () => {
                            notify.error(
                                'An exercise with that name already exists'
                            )
                            resetField('name')
                        },
                    },
                    fallbackMessage: 'Failed to update exercise',
                })
                return
            }
            notify.success('Exercise updated')
            await onSuccess()
            close()
        } finally {
            onRowLoadingChange(exercise.id, false)
        }
    }

    const formDialogTitle = isCreateMode
        ? 'Create Exercise'
        : isViewMode
          ? 'View Exercise'
          : 'Edit Exercise'
    const formSubmitButtonText = isCreateMode ? 'Create' : 'Save'
    const formSubmittingButtonText = isCreateMode ? 'Creating...' : 'Saving...'
    const submitButtonDisabled = isSubmitting || !isDirty

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
                onPointerDownOutside={(e) => {
                    e.preventDefault()
                    attemptClose()
                }}
                onEscapeKeyDown={(e) => {
                    e.preventDefault()
                    attemptClose()
                }}
            >
                <DialogHeader>
                    <DialogTitle>{formDialogTitle}</DialogTitle>
                    {!isViewMode && (
                        <DialogDescription>
                            Set exercise details and assign target muscle groups
                        </DialogDescription>
                    )}
                </DialogHeader>
                <form
                    id="exercise-form"
                    className="space-y-4"
                    onSubmit={(e) => {
                        if (isCreateMode)
                            void handleSubmit(onSubmitCreateForm)(e)
                        else void handleSubmit(onSubmitEditForm)(e)
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
                        {isViewMode ? (
                            selectedMuscleGroupIds.length ? (
                                <div className="flex flex-wrap gap-1">
                                    {muscleGroups.map(
                                        (group) =>
                                            selectedMuscleGroupIds.includes(
                                                group.id
                                            ) && (
                                                <span
                                                    key={group.id}
                                                    className="rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                                                >
                                                    {capitalizeWords(
                                                        group.name
                                                    )}
                                                </span>
                                            )
                                    )}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    {dash}
                                </span>
                            )
                        ) : (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        placeholder="Search muscle groups..."
                                        value={searchQuery}
                                        onChange={(event) => {
                                            setSearchQuery(event.target.value)
                                        }}
                                        className={isSearching ? 'pr-8' : ''}
                                    />
                                    {isSearching && (
                                        <Spinner className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="max-h-50 space-y-2 overflow-y-auto rounded-md border p-3">
                                    {displayedMuscleGroups.length ? (
                                        displayedMuscleGroups.map((group) => {
                                            const checked =
                                                selectedMuscleGroupIds.includes(
                                                    group.id
                                                )
                                            return (
                                                <label
                                                    key={group.id}
                                                    className="flex cursor-pointer gap-2"
                                                >
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(
                                                            value
                                                        ) => {
                                                            toggleMuscleGroup(
                                                                group.id,
                                                                value === true
                                                            )
                                                        }}
                                                        disabled={isSubmitting}
                                                    />
                                                    <span className="text-sm">
                                                        <span className="font-medium">
                                                            {capitalizeWords(
                                                                group.name
                                                            )}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            &mdash;{' '}
                                                            {group.description}
                                                        </span>
                                                    </span>
                                                </label>
                                            )
                                        })
                                    ) : (
                                        <div className="text-sm text-muted-foreground">
                                            No muscle groups found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </FormField>
                    {exercise?.user_id !== null && !isCreateMode && (
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
                            onClick={(e) => {
                                e.preventDefault()
                                attemptClose()
                            }}
                        >
                            {isViewMode ? 'Close' : 'Cancel'}
                        </Button>
                    </DialogClose>
                    {!isViewMode && (
                        <Button
                            form="exercise-form"
                            type="submit"
                            variant="success"
                            disabled={submitButtonDisabled}
                        >
                            {isSubmitting
                                ? formSubmittingButtonText
                                : formSubmitButtonText}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
