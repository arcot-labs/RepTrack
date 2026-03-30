import {
    ExerciseService,
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
    type MuscleGroupSearchResult,
} from '@/api/generated'
import {
    zCreateExerciseRequest,
    zUpdateExerciseRequest,
} from '@/api/generated/zod.gen'
import { Field } from '@/components/forms/Field'
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
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { capitalizeWords } from '@/lib/text'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type CreateExerciseForm = z.infer<typeof zCreateExerciseRequest>
type UpdateExerciseForm = z.infer<typeof zUpdateExerciseRequest>

const defaultCreateExerciseFormValues: CreateExerciseForm = {
    name: '',
    description: '',
    muscle_group_ids: [],
}

const defaultUpdateExerciseFormValues: UpdateExerciseForm = {
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
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<
        MuscleGroupSearchResult[] | null
    >(null)
    const searchRequestIdRef = useRef(0)

    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        setValue: setValueCreate,
        watch: watchCreate,
        formState: {
            errors: createErrors,
            isDirty: isCreateDirty,
            isSubmitting: isCreateSubmitting,
        },
        reset: resetCreate,
    } = useForm<CreateExerciseForm>({
        resolver: zodResolver(zCreateExerciseRequest),
        defaultValues: defaultCreateExerciseFormValues,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        setValue: setValueEdit,
        watch: watchEdit,
        formState: {
            errors: editErrors,
            isDirty: isEditDirty,
            dirtyFields: editDirtyFields,
            isSubmitting: isEditSubmitting,
        },
        reset: resetEdit,
    } = useForm({
        resolver: zodResolver(zUpdateExerciseRequest),
        defaultValues: defaultUpdateExerciseFormValues,
        mode: 'onSubmit',
        reValidateMode: 'onChange',
    })

    const isCreateMode = mode === 'create'
    const isViewMode = mode === 'view'
    const isSubmitting =
        (isCreateMode ? isCreateSubmitting : isEditSubmitting) || isRowLoading
    const isDirty = isCreateMode ? isCreateDirty : isEditDirty
    const errors = isCreateMode ? createErrors : editErrors

    const selectedMuscleGroupIds = isCreateMode
        ? (watchCreate('muscle_group_ids') ?? [])
        : (watchEdit('muscle_group_ids') ?? [])

    useEffect(() => {
        if (!open) return
        if (isCreateMode) {
            if (exercise) {
                // copying existing exercise
                resetCreate(
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
            resetCreate(defaultCreateExerciseFormValues)
            return
        }
        if (exercise) {
            resetEdit({
                name: exercise.name,
                description: exercise.description,
                muscle_group_ids: exercise.muscle_groups.map((mg) => mg.id),
            })
            return
        }
        resetEdit(defaultUpdateExerciseFormValues)
    }, [open, isCreateMode, exercise, resetCreate, resetEdit])

    useEffect(() => {
        if (!open || isViewMode) {
            setSearchQuery('')
            setDebouncedSearchQuery('')
            setSearchResults(null)
            setIsSearching(false)
            return
        }
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim())
        }, 300)
        return () => {
            clearTimeout(timeout)
        }
    }, [searchQuery, open, isViewMode])

    useEffect(() => {
        if (!open || isViewMode || !debouncedSearchQuery) {
            searchRequestIdRef.current += 1
            setSearchResults(null)
            setIsSearching(false)
            return
        }
        const requestId = searchRequestIdRef.current + 1
        searchRequestIdRef.current = requestId
        setIsSearching(true)
        void (async () => {
            const { data, error } = await SearchService.searchMuscleGroups({
                body: {
                    query: debouncedSearchQuery,
                    limit: Math.min(muscleGroups.length, 1000),
                },
            })
            if (requestId !== searchRequestIdRef.current) return
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to search muscle groups',
                })
                setSearchResults(null)
                return
            }
            setSearchResults(data)
        })().finally(() => {
            if (requestId === searchRequestIdRef.current) setIsSearching(false)
        })
    }, [debouncedSearchQuery, muscleGroups.length, open, isViewMode])

    const displayedMuscleGroups = useMemo(() => {
        if (!searchResults) {
            return muscleGroups
        }
        const byId = new Map(muscleGroups.map((group) => [group.id, group]))
        return searchResults
            .map((hit) => byId.get(hit.id))
            .filter((group): group is MuscleGroupPublic => !!group)
    }, [muscleGroups, searchResults])

    const handleAttemptCloseDialog = (e: Event) => {
        if (isDirty && !confirm('Discard changes?')) {
            e.preventDefault()
        }
    }

    const closeDialog = () => {
        if (isCreateMode) resetCreate(defaultCreateExerciseFormValues)
        else if (!isViewMode) resetEdit(defaultUpdateExerciseFormValues)
        onOpenChange(false)
    }

    const toggleMuscleGroup = (muscleGroupId: number, checked: boolean) => {
        const selected = new Set(selectedMuscleGroupIds)

        if (checked) selected.add(muscleGroupId)
        else selected.delete(muscleGroupId)

        if (isCreateMode)
            setValueCreate('muscle_group_ids', Array.from(selected), {
                shouldDirty: true,
                shouldValidate: true,
            })
        else
            setValueEdit('muscle_group_ids', Array.from(selected), {
                shouldDirty: true,
                shouldValidate: true,
            })
    }

    const onSubmitCreateForm = async (form: CreateExerciseForm) => {
        const name = form.name.trim()
        const desc = form.description?.trim() ?? ''

        const { error } = await ExerciseService.createExercise({
            body: {
                name,
                description: desc,
                muscle_group_ids: form.muscle_group_ids,
            },
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
                        resetCreate({ ...form, name: '' })
                    },
                },
                fallbackMessage: 'Failed to create exercise',
            })
            return
        }
        notify.success('Exercise created')
        await onSuccess()
        closeDialog()
    }

    const onSubmitEditForm = async (form: UpdateExerciseForm) => {
        if (!exercise) {
            notify.error('Exercise data is missing. Try again')
            closeDialog()
            return
        }

        if (!isEditDirty) {
            notify.warning('No changes to save')
            closeDialog()
            return
        }

        const body: UpdateExerciseForm = {}
        if (editDirtyFields.name) body.name = form.name?.trim() ?? ''
        if (editDirtyFields.description)
            body.description = form.description?.trim() ?? ''
        if (editDirtyFields.muscle_group_ids)
            body.muscle_group_ids = form.muscle_group_ids ?? []

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
                            resetEdit({ ...form, name: exercise.name })
                        },
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

    const formDialogTitle = isCreateMode
        ? 'Create Exercise'
        : isViewMode
          ? 'View Exercise'
          : 'Edit Exercise'
    const formSubmitButtonText = isCreateMode ? 'Create' : 'Save'
    const formSubmittingButtonText = isCreateMode ? 'Creating...' : 'Saving...'
    const cancelButtonDisabled = isSubmitting || !isDirty

    return (
        <Dialog
            open={open}
            onOpenChange={() => {
                // only triggered on close (open state controlled by parent)
                if (!isSubmitting) closeDialog()
            }}
        >
            <DialogContent
                aria-describedby={undefined}
                onPointerDownOutside={(e) => {
                    handleAttemptCloseDialog(e)
                }}
                showCloseButton={false}
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
                            void handleSubmitCreate(onSubmitCreateForm)(e)
                        else void handleSubmitEdit(onSubmitEditForm)(e)
                    }}
                >
                    <Field
                        label="Name"
                        htmlFor="exercise-name"
                        error={errors.name?.message}
                    >
                        {isViewMode ? (
                            <div className="text-sm text-muted-foreground">
                                {capitalizeWords(exercise?.name ?? '—')}
                            </div>
                        ) : (
                            <Input
                                id="exercise-name"
                                placeholder="e.g., Barbell Squat"
                                aria-invalid={!!errors.name}
                                {...(isCreateMode
                                    ? registerCreate('name')
                                    : registerEdit('name'))}
                            />
                        )}
                    </Field>
                    <Field
                        label="Description"
                        htmlFor="exercise-description"
                        error={errors.description?.message}
                    >
                        {isViewMode ? (
                            <div className="text-sm text-muted-foreground">
                                {exercise?.description ?? '—'}
                            </div>
                        ) : (
                            <Input
                                id="exercise-description"
                                placeholder="e.g., Lower-body compound movement"
                                aria-invalid={!!errors.description}
                                {...(isCreateMode
                                    ? registerCreate('description')
                                    : registerEdit('description'))}
                            />
                        )}
                    </Field>
                    <Field
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
                                    —
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
                    </Field>
                    {exercise?.user_id !== null && !isCreateMode && (
                        <Field label="Last Updated">
                            <div className="text-sm text-muted-foreground">
                                {exercise?.updated_at
                                    ? new Date(
                                          exercise.updated_at
                                      ).toLocaleString()
                                    : '—'}
                            </div>
                        </Field>
                    )}
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={(e) => {
                                handleAttemptCloseDialog(e as unknown as Event)
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
                            disabled={cancelButtonDisabled}
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
