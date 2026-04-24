import { Exercises } from '@/pages/Exercises'
import { getMockProps } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

interface UseExercisesReturn {
    exercises: unknown[]
    isLoading: boolean
    reload: () => Promise<void>
    remove: (exerciseId: number) => void
}

interface UseMuscleGroupsReturn {
    muscleGroups: unknown[]
    isLoading: boolean
    reload: () => Promise<void>
}

const useExercisesMock: MockedFunction<() => UseExercisesReturn> = vi.fn()
const useMuscleGroupsMock: MockedFunction<() => UseMuscleGroupsReturn> = vi.fn()

const exercisesTableMock = vi.fn()

vi.mock('@/components/exercises/useExercises', () => ({
    useExercises: () => useExercisesMock(),
}))

vi.mock('@/components/muscle-groups/useMuscleGroups', () => ({
    useMuscleGroups: () => useMuscleGroupsMock(),
}))

vi.mock('@/components/exercises/ExercisesTable', () => ({
    ExercisesTable: (props: Record<string, unknown>) => {
        exercisesTableMock(props)
        return <div data-testid="exercises-table" />
    },
}))

describe('Exercises', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useExercisesMock.mockReturnValue({
            exercises: [{ id: 1 }],
            isLoading: false,
            reload: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn(),
        })
        useMuscleGroupsMock.mockReturnValue({
            muscleGroups: [{ id: 2 }],
            isLoading: false,
            reload: vi.fn().mockResolvedValue(undefined),
        })
    })

    it('renders page title', () => {
        render(<Exercises />)

        expect(screen.getByText('Exercises')).toBeInTheDocument()
    })

    it('wires hook data into ExercisesTable', () => {
        const reloadExercises = vi.fn().mockResolvedValue(undefined)
        const removeExercise = vi.fn()
        const reloadMuscleGroups = vi.fn().mockResolvedValue(undefined)

        useExercisesMock.mockReturnValue({
            exercises: [{ id: 123 }],
            isLoading: true,
            reload: reloadExercises,
            remove: removeExercise,
        })

        useMuscleGroupsMock.mockReturnValue({
            muscleGroups: [{ id: 456 }],
            isLoading: false,
            reload: reloadMuscleGroups,
        })

        render(<Exercises />)

        expect(screen.getByTestId('exercises-table')).toBeInTheDocument()
        expect(exercisesTableMock).toHaveBeenCalledOnce()

        const props = getMockProps(exercisesTableMock) as {
            exercises: unknown[]
            muscleGroups: unknown[]
            isLoading: boolean
            onExerciseDeleted: unknown
            onReloadExercises: unknown
            onReloadMuscleGroups: unknown
        }

        expect(props.exercises).toEqual([{ id: 123 }])
        expect(props.muscleGroups).toEqual([{ id: 456 }])
        expect(props.isLoading).toBe(true)
        expect(props.onExerciseDeleted).toBe(removeExercise)
        expect(props.onReloadExercises).toBe(reloadExercises)
        expect(props.onReloadMuscleGroups).toBe(reloadMuscleGroups)
    })

    it('marks table as loading when either hook is loading', () => {
        useExercisesMock.mockReturnValue({
            exercises: [],
            isLoading: false,
            reload: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn(),
        })

        useMuscleGroupsMock.mockReturnValue({
            muscleGroups: [],
            isLoading: true,
            reload: vi.fn().mockResolvedValue(undefined),
        })

        render(<Exercises />)

        const props = getMockProps(exercisesTableMock) as {
            isLoading: boolean
        }
        expect(props.isLoading).toBe(true)
    })
})
