import { ExerciseService, type ExercisePublic } from '@/api/generated'
import {
    formatExerciseName,
    getExerciseDialogLabels,
    getExerciseFormValues,
    getExerciseRowActions,
    getExerciseRowActionsConfig,
    getExerciseToolbarConfig,
    getExerciseUpdateBody,
    getSelectedExerciseMuscleGroups,
    getToggledMuscleGroupIds,
    handleDeleteExercise,
} from '@/components/exercises/utils'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { blueText, redText } from '@/lib/styles'
import { Copy, Eye, Pencil, Trash } from 'lucide-react'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'

vi.mock('@/api/generated', () => ({
    ExerciseService: {
        deleteExercise: vi.fn(),
    },
}))

vi.mock('@/lib/text', () => ({
    capitalizeWords: vi.fn((value: string) => `${value} - capitalized`),
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const mockExerciseId = 1

const mockExercise: ExercisePublic = {
    id: mockExerciseId,
    user_id: 42,
    name: 'Back Squat',
    description: 'Barbell squat',
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
    muscle_groups: [],
}

const mockMuscleGroups = [
    {
        id: 10,
        name: 'quads',
        description: 'Quadriceps muscles',
    },
    {
        id: 20,
        name: 'glutes',
        description: 'Glute muscles',
    },
    {
        id: 30,
        name: 'hamstrings',
        description: 'Hamstring muscles',
    },
]

const callHandleDelete = async (
    payload: { error: unknown } = { error: undefined },
    exerciseId: number = mockExerciseId
) => {
    vi.mocked(ExerciseService).deleteExercise.mockReturnValue(
        Promise.resolve(payload) as never
    )

    const onExerciseDeleted = vi.fn()
    const refreshSearchResults = vi.fn()
    const onReloadExercises = vi.fn().mockResolvedValue(undefined)
    const setRowLoading = vi.fn()

    await handleDeleteExercise(
        exerciseId,
        onExerciseDeleted,
        refreshSearchResults,
        onReloadExercises,
        setRowLoading
    )

    return {
        onExerciseDeleted,
        refreshSearchResults,
        onReloadExercises,
        setRowLoading,
    }
}

describe('formatExerciseName', () => {
    it('returns custom exercise name as is', () => {
        expect(formatExerciseName(mockExercise)).toBe('Back Squat')
    })

    it('returns system exercise name capitalized', () => {
        const systemExercise = { ...mockExercise, user_id: null }
        expect(formatExerciseName(systemExercise)).toBe(
            'Back Squat - capitalized'
        )
    })
})

describe('handleDeleteExercise', () => {
    let successSpy: MockInstance<typeof notify.success>
    let errorSpy: MockInstance<typeof notify.error>

    beforeEach(() => {
        successSpy = vi.spyOn(notify, 'success').mockImplementation(vi.fn())
        errorSpy = vi.spyOn(notify, 'error').mockImplementation(vi.fn())
        vi.clearAllMocks()
    })

    it('calls service with correct path', async () => {
        await callHandleDelete()

        expect(
            vi.mocked(ExerciseService).deleteExercise
        ).toHaveBeenCalledExactlyOnceWith({
            path: { exercise_id: mockExerciseId },
        })
    })

    it('handles success', async () => {
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete()

        expect(successSpy).toHaveBeenCalledExactlyOnceWith('Exercise deleted')
        expect(onExerciseDeleted).toHaveBeenCalledExactlyOnceWith(
            mockExerciseId
        )
        expect(refreshSearchResults).toHaveBeenCalledOnce()
        expect(onReloadExercises).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles error', async () => {
        vi.mocked(handleApiError).mockResolvedValue(undefined)

        const mockError = { code: 'SOME_ERROR', detail: 'error' }
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete({ error: mockError })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to delete exercise',
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                httpErrorHandlers: expect.objectContaining({}),
            })
        )
        expect(successSpy).not.toHaveBeenCalled()
        expect(onExerciseDeleted).not.toHaveBeenCalled()
        expect(refreshSearchResults).not.toHaveBeenCalled()
        expect(onReloadExercises).not.toHaveBeenCalled()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })

    it('handles exercise_not_found error', async () => {
        vi.mocked(handleApiError).mockImplementationOnce(
            async (error, options) => {
                await options.httpErrorHandlers?.exercise_not_found?.(
                    error as never
                )
            }
        )

        const mockError = {
            code: 'exercise_not_found',
            detail: 'Exercise does not exist',
        }
        const {
            onExerciseDeleted,
            refreshSearchResults,
            onReloadExercises,
            setRowLoading,
        } = await callHandleDelete({ error: mockError })

        expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
            'Exercise not found. Reloading data'
        )
        expect(onExerciseDeleted).not.toHaveBeenCalled()
        expect(refreshSearchResults).not.toHaveBeenCalled()
        expect(onReloadExercises).toHaveBeenCalledOnce()
        expect(setRowLoading).toHaveBeenCalledTimes(2)
    })
})

describe('getExerciseRowActions', () => {
    it('returns view and copy actions for shared exercises', () => {
        const sharedExercise = { ...mockExercise, user_id: null }

        const items = getExerciseRowActions(
            sharedExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items).toHaveLength(2)

        const [view, copy] = items
        expect(view).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: Eye,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
        expect(copy).toEqual(
            expect.objectContaining({
                type: 'action',
                className: blueText,
                icon: Copy,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
    })

    it('returns edit, copy, and delete actions for user exercises', () => {
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items).toHaveLength(3)

        const [edit, copy, del] = items
        expect(edit).toEqual(
            expect.objectContaining({
                type: 'action',
                icon: Pencil,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
                disabled: false,
            })
        )
        expect(copy).toEqual(
            expect.objectContaining({
                type: 'action',
                className: blueText,
                icon: Copy,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
        expect(del).toEqual(
            expect.objectContaining({
                type: 'action',
                className: redText,
                icon: Trash,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                onSelect: expect.any(Function),
            })
        )
    })

    it('disables only edit action when row is loading', () => {
        const items = getExerciseRowActions(
            mockExercise,
            true,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        expect(items[0]?.disabled).toBe(true)
        expect(items[1]?.disabled).toBeUndefined()
        expect(items[2]?.disabled).toBeUndefined()
    })

    it('calls openViewDialog on view for shared exercises', async () => {
        const openViewDialog = vi.fn()
        const sharedExercise = { ...mockExercise, user_id: null }
        const items = getExerciseRowActions(
            sharedExercise,
            false,
            openViewDialog,
            vi.fn(),
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(openViewDialog).toHaveBeenCalledExactlyOnceWith(sharedExercise)
    })

    it('calls openCopyDialog on copy for shared exercises', async () => {
        const openCopyDialog = vi.fn()
        const sharedExercise = { ...mockExercise, user_id: null }
        const items = getExerciseRowActions(
            sharedExercise,
            false,
            vi.fn(),
            openCopyDialog,
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openCopyDialog).toHaveBeenCalledExactlyOnceWith(sharedExercise)
    })

    it('calls openEditDialog on edit for user exercises', async () => {
        const openEditDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            openEditDialog,
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[0]!.onSelect!(undefined)

        expect(openEditDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })

    it('calls openCopyDialog on copy for user exercises', async () => {
        const openCopyDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            openCopyDialog,
            vi.fn(),
            vi.fn()
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[1]!.onSelect!(undefined)

        expect(openCopyDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })

    it('calls openDeleteDialog on delete for user exercises', async () => {
        const openDeleteDialog = vi.fn()
        const items = getExerciseRowActions(
            mockExercise,
            false,
            vi.fn(),
            vi.fn(),
            vi.fn(),
            openDeleteDialog
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await items[2]!.onSelect!(undefined)

        expect(openDeleteDialog).toHaveBeenCalledExactlyOnceWith(mockExercise)
    })
})

describe('getExerciseRowActionsConfig', () => {
    it('builds row actions config and forwards callbacks', () => {
        const isRowLoading = vi.fn(() => true)
        const openFormDialog = vi.fn()
        const openDeleteDialog = vi.fn()

        const config = getExerciseRowActionsConfig({
            isRowLoading,
            openFormDialog,
            openDeleteDialog,
        })

        expect(config.schema).toBeDefined()

        const items = config.menuItems(mockExercise)

        expect(isRowLoading).toHaveBeenCalledExactlyOnceWith(mockExercise.id)
        expect(items).toHaveLength(3)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        void items[0]!.onSelect!(undefined)
        expect(openFormDialog).toHaveBeenCalledWith('edit', mockExercise)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        void items[1]!.onSelect!(undefined)
        expect(openFormDialog).toHaveBeenCalledWith('create', mockExercise)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        void items[2]!.onSelect!(undefined)
        expect(openDeleteDialog).toHaveBeenCalledWith(mockExercise)
    })

    it('builds shared-exercise actions with view and copy callbacks', () => {
        const sharedExercise = { ...mockExercise, user_id: null }
        const openFormDialog = vi.fn()

        const config = getExerciseRowActionsConfig({
            isRowLoading: vi.fn(() => false),
            openFormDialog,
            openDeleteDialog: vi.fn(),
        })

        const items = config.menuItems(sharedExercise)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        void items[0]!.onSelect!(undefined)
        expect(openFormDialog).toHaveBeenCalledWith('view', sharedExercise)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        void items[1]!.onSelect!(undefined)
        expect(openFormDialog).toHaveBeenCalledWith('create', sharedExercise)
    })
})

describe('getExerciseToolbarConfig', () => {
    it('builds search, filters, and action config', async () => {
        const setSearchQuery = vi.fn()
        const onCreateExercise = vi.fn()

        const config = getExerciseToolbarConfig({
            searchQuery: 'squat',
            setSearchQuery,
            isSearching: true,
            muscleGroups: [
                {
                    id: 10,
                    name: 'quads',
                    description: 'Quadriceps muscles',
                },
            ],
            onCreateExercise,
        })

        expect(config).toMatchObject({
            search: {
                placeholder: 'Search exercises...',
                value: 'squat',
                onChange: setSearchQuery,
                isLoading: true,
            },
            filters: [
                {
                    columnId: 'type',
                    title: 'Type',
                    options: [
                        { label: 'System', value: 'system' },
                        { label: 'Custom', value: 'custom' },
                    ],
                },
                {
                    columnId: 'muscle_groups',
                    title: 'Muscle Groups',
                    options: [{ label: 'quads - capitalized', value: '10' }],
                },
            ],
            showViewOptions: true,
        })

        await config.actions?.[0]?.onClick()
        expect(onCreateExercise).toHaveBeenCalledOnce()
    })
})

describe('getExerciseDialogLabels', () => {
    it('returns create labels', () => {
        expect(getExerciseDialogLabels('create')).toEqual({
            title: 'Create Exercise',
            submitButtonText: 'Create',
            submittingButtonText: 'Creating...',
        })
    })

    it('returns view labels', () => {
        expect(getExerciseDialogLabels('view')).toEqual({
            title: 'View Exercise',
            submitButtonText: 'Save',
            submittingButtonText: 'Saving...',
        })
    })

    it('returns edit labels', () => {
        expect(getExerciseDialogLabels('edit')).toEqual({
            title: 'Edit Exercise',
            submitButtonText: 'Save',
            submittingButtonText: 'Saving...',
        })
    })
})

describe('getSelectedExerciseMuscleGroups', () => {
    it('returns only selected muscle groups in source order', () => {
        expect(
            getSelectedExerciseMuscleGroups(mockMuscleGroups, [30, 10])
        ).toEqual([mockMuscleGroups[0], mockMuscleGroups[2]])
    })

    it('returns empty array when nothing is selected', () => {
        expect(getSelectedExerciseMuscleGroups(mockMuscleGroups, [])).toEqual(
            []
        )
    })
})

describe('getExerciseFormValues', () => {
    it('returns blank defaults for creating new exercise', () => {
        expect(getExerciseFormValues('create', null)).toEqual({
            name: '',
            description: '',
            muscle_group_ids: [],
        })
    })

    it('returns copied values for creating from existing exercise', () => {
        const exercise = {
            ...mockExercise,
            description: 'Barbell squat',
            muscle_groups: mockMuscleGroups.slice(0, 2),
        }

        expect(getExerciseFormValues('create', exercise)).toEqual({
            name: 'Back Squat - copy',
            description: 'Barbell squat',
            muscle_group_ids: [10, 20],
        })
    })

    it('returns edit values from provided exercise', () => {
        const exercise = {
            ...mockExercise,
            muscle_groups: mockMuscleGroups.slice(1),
        }

        expect(getExerciseFormValues('edit', exercise)).toEqual({
            name: 'Back Squat',
            description: 'Barbell squat',
            muscle_group_ids: [20, 30],
        })
    })

    it('returns view values from provided exercise', () => {
        const exercise = {
            ...mockExercise,
            muscle_groups: mockMuscleGroups.slice(0, 1),
        }

        expect(getExerciseFormValues('view', exercise)).toEqual({
            name: 'Back Squat',
            description: 'Barbell squat',
            muscle_group_ids: [10],
        })
    })

    it('throws when edit mode is missing exercise data', () => {
        expect(() => getExerciseFormValues('edit', null)).toThrow(
            'Exercise data missing for edit/view mode'
        )
    })

    it('throws when view mode is missing exercise data', () => {
        expect(() => getExerciseFormValues('view', null)).toThrow(
            'Exercise data missing for edit/view mode'
        )
    })
})

describe('getToggledMuscleGroupIds', () => {
    it('adds muscle group when checked', () => {
        expect(getToggledMuscleGroupIds([10, 30], 20, true)).toEqual([
            10, 30, 20,
        ])
    })

    it('removes muscle group when unchecked', () => {
        expect(getToggledMuscleGroupIds([10, 20, 30], 20, false)).toEqual([
            10, 30,
        ])
    })

    it('avoids duplicates when checking already selected group', () => {
        expect(getToggledMuscleGroupIds([10, 20], 20, true)).toEqual([10, 20])
    })
})

describe('getExerciseUpdateBody', () => {
    it('returns only dirty fields', () => {
        expect(
            getExerciseUpdateBody(
                {
                    name: true,
                    description: false,
                    muscle_group_ids: true,
                },
                {
                    name: 'Front Squat',
                    description: 'Upright squat',
                    muscle_group_ids: [20, 30],
                }
            )
        ).toEqual({
            name: 'Front Squat',
            muscle_group_ids: [20, 30],
        })
    })

    it('returns empty body when nothing is dirty', () => {
        expect(
            getExerciseUpdateBody(
                {
                    name: false,
                    description: false,
                    muscle_group_ids: false,
                },
                {
                    name: 'Front Squat',
                    description: 'Upright squat',
                    muscle_group_ids: [20, 30],
                }
            )
        ).toEqual({})
    })

    it('includes muscle_group_ids when array entry is dirty', () => {
        expect(
            getExerciseUpdateBody(
                {
                    muscle_group_ids: [false, true],
                },
                {
                    muscle_group_ids: [20, 30],
                }
            )
        ).toEqual({
            muscle_group_ids: [20, 30],
        })
    })

    it('does not include muscle_group_ids when dirty array is empty', () => {
        expect(
            getExerciseUpdateBody(
                {
                    muscle_group_ids: [],
                },
                {
                    muscle_group_ids: [20, 30],
                }
            )
        ).toEqual({})
    })

    it('does not include muscle_group_ids when dirty array has no true values', () => {
        expect(
            getExerciseUpdateBody(
                {
                    muscle_group_ids: [false, false],
                },
                {
                    muscle_group_ids: [20, 30],
                }
            )
        ).toEqual({})
    })

    it('normalizes nullish dirty values to empty defaults', () => {
        expect(
            getExerciseUpdateBody(
                {
                    name: true,
                    description: true,
                    muscle_group_ids: true,
                },
                {
                    name: null,
                    description: undefined,
                    muscle_group_ids: null,
                }
            )
        ).toEqual({
            name: '',
            description: '',
            muscle_group_ids: [],
        })
    })
})
