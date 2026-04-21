import type { ExercisePublic, MuscleGroupPublic } from '@/api/generated'
import { ExerciseFormDialog } from '@/components/exercises/ExerciseFormDialog'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dialogRootMock = vi.hoisted(() => vi.fn())
const reactHookFormState = vi.hoisted(() => ({
    overrideMuscleGroupWatch: false,
    muscleGroupWatchValue: undefined as number[] | undefined,
}))
const selectorMock = vi.hoisted(() => vi.fn())
const submitFormMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
const submitHookMock = vi.hoisted(() => vi.fn())

vi.mock('react-hook-form', async () => {
    const actual =
        await vi.importActual<typeof import('react-hook-form')>(
            'react-hook-form'
        )

    return {
        ...actual,
        useForm: vi.fn((...args: Parameters<typeof actual.useForm>) => {
            const form = actual.useForm(...args)
            if (!reactHookFormState.overrideMuscleGroupWatch) {
                return form
            }
            return {
                ...form,
                watch: vi.fn((name?: string) => {
                    if (name === 'muscle_group_ids') {
                        return reactHookFormState.muscleGroupWatchValue
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    return form.watch(name as never)
                }),
            }
        }),
    }
})

vi.mock('@/components/ui/dialog', async () => {
    const actual = await vi.importActual<
        typeof import('@/components/ui/dialog')
    >('@/components/ui/dialog')

    return {
        ...actual,
        Dialog: (props: React.ComponentProps<typeof actual.Dialog>) => {
            dialogRootMock(props)
            return <actual.Dialog {...props} />
        },
    }
})

vi.mock('@/components/exercises/ExerciseMuscleGroupSelector', () => ({
    ExerciseMuscleGroupSelector: (
        props: {
            selectedMuscleGroupIds: number[]
            onSelectedMuscleGroupIdsChange: (muscleGroupIds: number[]) => void
        } & Record<string, unknown>
    ) => {
        selectorMock(props)
        return (
            <div data-testid="mock-muscle-group-selector">
                <div data-testid="selected-muscle-group-ids">
                    {props.selectedMuscleGroupIds.join(',')}
                </div>
                <button
                    type="button"
                    onClick={() => {
                        props.onSelectedMuscleGroupIdsChange([20])
                    }}
                >
                    Select Mock Muscle Group
                </button>
            </div>
        )
    },
}))

vi.mock('@/components/exercises/useExerciseFormDialogSubmit', async () => {
    const actual = await vi.importActual<
        typeof import('@/components/exercises/useExerciseFormDialogSubmit')
    >('@/components/exercises/useExerciseFormDialogSubmit')
    return {
        ...actual,
        useExerciseFormDialogSubmit: submitHookMock,
    }
})

vi.mock('@/lib/datetime', () => ({
    formatNullableDateTime: vi.fn(
        (value: string | null | undefined) => `formatted-date:${value ?? ''}`
    ),
}))

vi.mock('@/lib/text', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/text')>('@/lib/text')
    return {
        ...actual,
        formatNullableString: vi.fn(
            (value: string | null | undefined) =>
                `formatted-string:${value ?? ''}`
        ),
    }
})

const mockMuscleGroups: MuscleGroupPublic[] = [
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
]

const mockExercise: ExercisePublic = {
    id: 1,
    user_id: 2,
    name: 'Back Squat',
    description: 'Barbell squat',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
    muscle_groups: mockMuscleGroups,
}

const renderDialog = (
    overrides: Partial<Parameters<typeof ExerciseFormDialog>[0]> = {}
) => {
    const props: Parameters<typeof ExerciseFormDialog>[0] = {
        open: true,
        mode: 'create',
        exercise: null,
        muscleGroups: mockMuscleGroups,
        isRowLoading: false,
        onOpenChange: vi.fn(),
        onSuccess: vi.fn().mockResolvedValue(undefined),
        onReloadExercises: vi.fn().mockResolvedValue(undefined),
        onReloadMuscleGroups: vi.fn().mockResolvedValue(undefined),
        onRowLoadingChange: vi.fn(),
        ...overrides,
    }
    return {
        ...render(<ExerciseFormDialog {...props} />),
        props,
    }
}

const getLatestSelectorProps = () => {
    const call = selectorMock.mock.calls.at(-1)
    if (!call) throw new Error('Selector mock was not called')
    return call[0] as {
        readOnly: boolean
        open: boolean
        disabled: boolean
        selectedMuscleGroupIds: number[]
    }
}

const getLatestDialogRootProps = () => {
    const call = dialogRootMock.mock.calls.at(-1)
    if (!call) throw new Error('Dialog root mock was not called')
    return call[0] as {
        onOpenChange: (isOpen: boolean) => void
    }
}

describe('ExerciseFormDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        reactHookFormState.overrideMuscleGroupWatch = false
        reactHookFormState.muscleGroupWatchValue = undefined
        submitFormMock.mockResolvedValue(undefined)
        submitHookMock.mockReturnValue({
            submitForm: submitFormMock,
        })
    })

    it('renders create mode and submits only after form is dirty', async () => {
        renderDialog()

        expect(screen.getByText('Create Exercise')).toBeInTheDocument()
        expect(
            screen.getByText(
                'Set exercise details and assign target muscle groups'
            )
        ).toBeInTheDocument()
        expect(getLatestSelectorProps()).toMatchObject({
            open: true,
            readOnly: false,
            disabled: false,
            selectedMuscleGroupIds: [],
        })

        const submitButton = screen.getByRole('button', { name: 'Create' })
        expect(submitButton).toBeDisabled()

        await userEvent.type(screen.getByLabelText('Name'), 'Goblet Squat')

        expect(submitButton).toBeEnabled()

        const form = document.getElementById('exercise-form')
        if (!form) throw new Error('Exercise form not found')
        fireEvent.submit(form)

        expect(submitFormMock).toHaveBeenCalledOnce()
    })

    it('hydrates edit mode values and updates watched muscle group ids', async () => {
        renderDialog({
            mode: 'edit',
            exercise: mockExercise,
        })

        expect(screen.getByText('Edit Exercise')).toBeInTheDocument()
        expect(screen.getByLabelText('Name')).toHaveValue('Back Squat')
        expect(screen.getByLabelText('Description')).toHaveValue(
            'Barbell squat'
        )
        expect(getLatestSelectorProps().selectedMuscleGroupIds).toEqual([
            10, 20,
        ])
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

        await userEvent.click(
            screen.getByRole('button', {
                name: 'Select Mock Muscle Group',
            })
        )

        expect(getLatestSelectorProps().selectedMuscleGroupIds).toEqual([20])
        expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    })

    it('falls back to an empty muscle group id list when watch is undefined', () => {
        reactHookFormState.overrideMuscleGroupWatch = true

        renderDialog()

        expect(getLatestSelectorProps().selectedMuscleGroupIds).toEqual([])
    })

    it('renders read-only exercise details and timestamps in view mode', () => {
        renderDialog({
            mode: 'view',
            exercise: mockExercise,
        })

        expect(screen.getByText('View Exercise')).toBeInTheDocument()
        expect(
            screen.getByText('formatted-string:Barbell squat')
        ).toBeInTheDocument()
        expect(
            screen.getByText('formatted-date:2026-04-16T00:00:00Z')
        ).toBeInTheDocument()
        expect(
            screen.getByText('formatted-date:2026-04-17T00:00:00Z')
        ).toBeInTheDocument()
        expect(
            screen.queryByRole('textbox', { name: 'Name' })
        ).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Save' })
        ).not.toBeInTheDocument()
        expect(getLatestSelectorProps().readOnly).toBe(true)
    })

    it('closes pristine dialog without confirmation', async () => {
        const confirmMock = vi.spyOn(window, 'confirm')
        const onOpenChange = vi.fn()

        renderDialog({ onOpenChange })

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(confirmMock).not.toHaveBeenCalled()
        expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('does not hydrate form state while closed', () => {
        renderDialog({
            open: false,
            mode: 'edit',
            exercise: mockExercise,
        })

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('routes close attempts through close guard', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false)
        const onOpenChange = vi.fn()

        renderDialog({ onOpenChange })

        await userEvent.type(screen.getByLabelText('Name'), 'Unsaved title')
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await userEvent.click(screen.getByRole('button', { name: 'Close' }))
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

        const overlay = document.querySelector('[data-slot="dialog-overlay"]')
        if (!overlay) throw new Error('Dialog overlay not found')

        fireEvent.pointerDown(overlay)

        expect(confirmMock).toHaveBeenCalledTimes(4)
        expect(confirmMock).toHaveBeenCalledWith('Discard changes?')
        expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('closes dirty dialog when discard is confirmed', async () => {
        const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true)
        const onOpenChange = vi.fn()

        renderDialog({ onOpenChange })

        await userEvent.type(screen.getByLabelText('Name'), 'Unsaved title')
        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

        expect(confirmMock).toHaveBeenCalledExactlyOnceWith('Discard changes?')
        expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('disables actions while row loading is active', () => {
        renderDialog({ isRowLoading: true })

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
        expect(
            screen.getByRole('button', { name: 'Creating...' })
        ).toBeDisabled()
        expect(getLatestSelectorProps().disabled).toBe(true)
    })

    it('ignores close attempts while submitting', () => {
        const confirmMock = vi.spyOn(window, 'confirm')
        const onOpenChange = vi.fn()

        renderDialog({ isRowLoading: true, onOpenChange })

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

        const overlay = document.querySelector('[data-slot="dialog-overlay"]')
        if (!overlay) throw new Error('Dialog overlay not found')

        fireEvent.pointerDown(overlay)

        expect(confirmMock).not.toHaveBeenCalled()
        expect(onOpenChange).not.toHaveBeenCalled()
    })

    it('ignores dialog root open events', () => {
        const onOpenChange = vi.fn()

        renderDialog({ onOpenChange })

        getLatestDialogRootProps().onOpenChange(true)

        expect(onOpenChange).not.toHaveBeenCalled()
    })
})
