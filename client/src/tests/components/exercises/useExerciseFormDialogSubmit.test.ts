import {
    createExerciseFormSchema,
    useExerciseFormDialogSubmit,
    type CreateExerciseForm,
    type CreateExerciseFormInput,
} from '@/components/exercises/useExerciseFormDialogSubmit'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { act, renderHook } from '@testing-library/react'
import type {
    FieldNamesMarkedBoolean,
    UseFormHandleSubmit,
    UseFormResetField,
} from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
    createExercise: vi.fn(),
    updateExercise: vi.fn(),
}))

vi.mock('@/api/generated', () => ({
    ExerciseService: apiMocks,
}))

vi.mock('@/lib/http', () => ({
    handleApiError: vi.fn(),
}))

const successMock = vi.hoisted(() => vi.fn())
const errorMock = vi.hoisted(() => vi.fn())
const warningMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/notify', () => ({
    notify: {
        success: successMock,
        error: errorMock,
        warning: warningMock,
    },
}))

vi.mock('@/lib/validation', () => ({
    preprocessTrim: (schema: unknown) => schema,
}))

const mockExercise = {
    id: 1,
    user_id: 2,
    name: 'Back Squat',
    description: 'Barbell squat',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
    muscle_groups: [],
}

const mockForm: CreateExerciseForm = createExerciseFormSchema.parse({
    name: 'Front Squat',
    description: 'Upright squat',
    muscle_group_ids: [10, 20],
})

const closeDialogMock = vi.fn()
const onSuccessMock = vi.fn().mockResolvedValue(undefined)
const onReloadExercisesMock = vi.fn().mockResolvedValue(undefined)
const onReloadMuscleGroupsMock = vi.fn().mockResolvedValue(undefined)
const onRowLoadingChangeMock = vi.fn()
const resetFieldMock =
    vi.fn() as unknown as UseFormResetField<CreateExerciseFormInput>

const createHandleSubmit = (
    form: CreateExerciseForm = mockForm
): UseFormHandleSubmit<CreateExerciseFormInput, CreateExerciseForm> => {
    return ((onValid) => {
        return async () => {
            await onValid(form)
        }
    }) as UseFormHandleSubmit<CreateExerciseFormInput, CreateExerciseForm>
}

const renderUseExerciseFormDialogSubmit = ({
    mode = 'create',
    exercise = null,
    isDirty = true,
    dirtyFields = {},
    handleSubmit = createHandleSubmit(),
}: {
    mode?: 'create' | 'edit' | 'view'
    exercise?: typeof mockExercise | null
    isDirty?: boolean
    dirtyFields?: FieldNamesMarkedBoolean<CreateExerciseFormInput>
    handleSubmit?: UseFormHandleSubmit<
        CreateExerciseFormInput,
        CreateExerciseForm
    >
} = {}) =>
    renderHook(() =>
        useExerciseFormDialogSubmit({
            mode,
            exercise,
            isDirty,
            dirtyFields,
            handleSubmit,
            resetField: resetFieldMock,
            closeDialog: closeDialogMock,
            onSuccess: onSuccessMock,
            onReloadExercises: onReloadExercisesMock,
            onReloadMuscleGroups: onReloadMuscleGroupsMock,
            onRowLoadingChange: onRowLoadingChangeMock,
        })
    )

beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.createExercise.mockResolvedValue({ error: undefined })
    apiMocks.updateExercise.mockResolvedValue({ error: undefined })
})

describe('useExerciseFormDialogSubmit', () => {
    it('creates exercise', async () => {
        const { result } = renderUseExerciseFormDialogSubmit()

        await act(async () => {
            await result.current.submitForm()
        })

        expect(apiMocks.createExercise).toHaveBeenCalledExactlyOnceWith({
            body: mockForm,
        })
        expect(notify.success).toHaveBeenCalledExactlyOnceWith(
            'Exercise created'
        )
        expect(onSuccessMock).toHaveBeenCalledOnce()
        expect(closeDialogMock).toHaveBeenCalledOnce()
    })

    it('handles create muscle_group_not_found error', async () => {
        const mockError = { code: 'muscle_group_not_found' }
        apiMocks.createExercise.mockResolvedValueOnce({ error: mockError })

        vi.mocked(handleApiError).mockImplementationOnce(
            async (_error, options) => {
                await options.httpErrorHandlers?.muscle_group_not_found?.(
                    mockError as never
                )
            }
        )

        const { result } = renderUseExerciseFormDialogSubmit()

        await act(async () => {
            await result.current.submitForm()
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to create exercise',
            })
        )
        expect(notify.error).toHaveBeenCalledExactlyOnceWith(
            'Invalid muscle group selected. Reloading data'
        )
        expect(onReloadMuscleGroupsMock).toHaveBeenCalledOnce()
        expect(closeDialogMock).not.toHaveBeenCalled()
    })

    it('handles create exercise_name_conflict error', async () => {
        const mockError = { code: 'exercise_name_conflict' }
        apiMocks.createExercise.mockResolvedValueOnce({ error: mockError })

        vi.mocked(handleApiError).mockImplementationOnce((_error, options) => {
            void options.httpErrorHandlers?.exercise_name_conflict?.(
                mockError as never
            )
            return Promise.resolve()
        })

        const { result } = renderUseExerciseFormDialogSubmit()

        await act(async () => {
            await result.current.submitForm()
        })

        expect(handleApiError).toHaveBeenCalledExactlyOnceWith(
            mockError,
            expect.objectContaining({
                fallbackMessage: 'Failed to create exercise',
            })
        )
        expect(notify.error).toHaveBeenCalledExactlyOnceWith(
            'An exercise with that name already exists'
        )
        expect(resetFieldMock).toHaveBeenCalledExactlyOnceWith('name')
    })

    it('closes edit mode when exercise data is missing', async () => {
        const { result } = renderUseExerciseFormDialogSubmit({
            mode: 'edit',
            exercise: null,
        })

        await act(async () => {
            await result.current.submitForm()
        })

        expect(notify.error).toHaveBeenCalledExactlyOnceWith(
            'Exercise data is missing. Try again'
        )
        expect(closeDialogMock).toHaveBeenCalledOnce()
        expect(apiMocks.updateExercise).not.toHaveBeenCalled()
    })

    it('skips edit submit when nothing is dirty', async () => {
        const { result } = renderUseExerciseFormDialogSubmit({
            mode: 'edit',
            exercise: mockExercise,
            isDirty: false,
        })

        await act(async () => {
            await result.current.submitForm()
        })

        expect(notify.warning).toHaveBeenCalledExactlyOnceWith(
            'No changes to save'
        )
        expect(closeDialogMock).toHaveBeenCalledOnce()
        expect(apiMocks.updateExercise).not.toHaveBeenCalled()
    })

    it('updates exercise using only dirty fields', async () => {
        const { result } = renderUseExerciseFormDialogSubmit({
            mode: 'edit',
            exercise: mockExercise,
            dirtyFields: {
                name: true,
                description: false,
                muscle_group_ids: [true],
            },
        })

        await act(async () => {
            await result.current.submitForm()
        })

        expect(onRowLoadingChangeMock).toHaveBeenNthCalledWith(1, 1, true)
        expect(apiMocks.updateExercise).toHaveBeenCalledExactlyOnceWith({
            path: { exercise_id: 1 },
            body: {
                name: 'Front Squat',
                muscle_group_ids: [10, 20],
            },
        })
        expect(notify.success).toHaveBeenCalledExactlyOnceWith(
            'Exercise updated'
        )
        expect(onSuccessMock).toHaveBeenCalledOnce()
        expect(closeDialogMock).toHaveBeenCalledOnce()
        expect(onRowLoadingChangeMock).toHaveBeenNthCalledWith(2, 1, false)
    })

    it('handles update exercise_not_found error', async () => {
        const mockError = { code: 'exercise_not_found' }
        apiMocks.updateExercise.mockResolvedValueOnce({ error: mockError })
        vi.mocked(handleApiError).mockImplementationOnce(
            async (_error, options) => {
                await options.httpErrorHandlers?.exercise_not_found?.(
                    mockError as never
                )
            }
        )

        const { result } = renderUseExerciseFormDialogSubmit({
            mode: 'edit',
            exercise: mockExercise,
            dirtyFields: { name: true },
        })

        await act(async () => {
            await result.current.submitForm()
        })

        expect(notify.error).toHaveBeenCalledExactlyOnceWith(
            'Exercise not found. Reloading data'
        )
        expect(closeDialogMock).toHaveBeenCalledOnce()
        expect(onReloadExercisesMock).toHaveBeenCalledOnce()
        expect(onRowLoadingChangeMock).toHaveBeenNthCalledWith(2, 1, false)
    })
})
