import { Workouts } from '@/pages/Workouts'
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

interface UseWorkoutsReturn {
    workouts: unknown[]
    isLoading: boolean
    reload: () => Promise<void>
    remove: (workoutId: number) => void
}

const useWorkoutsMock: MockedFunction<() => UseWorkoutsReturn> = vi.fn()

const workoutsTableMock = vi.fn()

vi.mock('@/components/workouts/useWorkouts', () => ({
    useWorkouts: () => useWorkoutsMock(),
}))

vi.mock('@/components/workouts/WorkoutsTable', () => ({
    WorkoutsTable: (props: Record<string, unknown>) => {
        workoutsTableMock(props)
        return <div data-testid="workouts-table" />
    },
}))

describe('Workouts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useWorkoutsMock.mockReturnValue({
            workouts: [{ id: 1 }],
            isLoading: false,
            reload: vi.fn().mockResolvedValue(undefined),
            remove: vi.fn(),
        })
    })

    it('renders page title', () => {
        render(<Workouts />)

        expect(screen.getByText('Workouts')).toBeInTheDocument()
    })

    it('wires hook data into WorkoutsTable', () => {
        const reloadWorkouts = vi.fn().mockResolvedValue(undefined)
        const removeWorkout = vi.fn()

        useWorkoutsMock.mockReturnValue({
            workouts: [{ id: 123 }],
            isLoading: true,
            reload: reloadWorkouts,
            remove: removeWorkout,
        })

        render(<Workouts />)

        expect(screen.getByTestId('workouts-table')).toBeInTheDocument()
        expect(workoutsTableMock).toHaveBeenCalledOnce()

        const props = getMockProps(workoutsTableMock) as {
            workouts: unknown[]
            isLoading: boolean
            onWorkoutDeleted: unknown
            onReloadWorkouts: unknown
        }

        expect(props.workouts).toEqual([{ id: 123 }])
        expect(props.isLoading).toBe(true)
        expect(props.onWorkoutDeleted).toBe(removeWorkout)
        expect(props.onReloadWorkouts).toBe(reloadWorkouts)
    })
})
