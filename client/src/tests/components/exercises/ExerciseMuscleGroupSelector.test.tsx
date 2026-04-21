import { SearchService, type MuscleGroupPublic } from '@/api/generated'
import { ExerciseMuscleGroupSelector } from '@/components/exercises/ExerciseMuscleGroupSelector'
import { dash } from '@/lib/text'
import { getMockProps } from '@/tests/utils'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/generated', () => ({
    SearchService: {
        searchMuscleGroups: vi.fn(),
    },
}))

const remoteSearchMocks = vi.hoisted(() => ({
    useRemoteSearch: vi.fn(),
    setSearchQuery: vi.fn(),
}))

vi.mock('@/components/useRemoteSearch', () => ({
    useRemoteSearch: remoteSearchMocks.useRemoteSearch,
}))

vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: ({
        checked,
        disabled,
        onCheckedChange,
    }: {
        checked?: boolean
        disabled?: boolean
        onCheckedChange?: (checked: boolean) => void
    }) => (
        <input
            data-testid="mock-checkbox"
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => {
                onCheckedChange?.(event.target.checked)
            }}
        />
    ),
}))

vi.mock('@/components/ui/spinner', () => ({
    Spinner: () => <div data-testid="mock-spinner" />,
}))

vi.mock('@/lib/text', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/text')>('@/lib/text')

    return {
        ...actual,
        capitalizeWords: vi.fn((value: string) => `${value} - capitalized`),
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

const renderSelector = (
    overrides: Partial<Parameters<typeof ExerciseMuscleGroupSelector>[0]> = {}
) =>
    render(
        <ExerciseMuscleGroupSelector
            open={true}
            readOnly={false}
            muscleGroups={mockMuscleGroups}
            selectedMuscleGroupIds={[10]}
            disabled={false}
            onSelectedMuscleGroupIdsChange={vi.fn()}
            {...overrides}
        />
    )

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(SearchService).searchMuscleGroups.mockResolvedValue({
        data: [],
        error: undefined,
    } as never)
    remoteSearchMocks.useRemoteSearch.mockReturnValue({
        searchQuery: 'qua',
        setSearchQuery: remoteSearchMocks.setSearchQuery,
        isSearching: false,
        displayedItems: mockMuscleGroups,
    })
})

describe('ExerciseMuscleGroupSelector', () => {
    it('renders dash in read-only mode when nothing is selected', () => {
        renderSelector({
            readOnly: true,
            selectedMuscleGroupIds: [],
        })

        expect(screen.getByText(dash)).toBeInTheDocument()
    })

    it('renders selected muscle groups in read-only mode', () => {
        renderSelector({
            readOnly: true,
            selectedMuscleGroupIds: [20],
        })

        expect(screen.getByText('glutes - capitalized')).toBeInTheDocument()
        expect(
            screen.queryByPlaceholderText('Search muscle groups...')
        ).not.toBeInTheDocument()
        expect(remoteSearchMocks.useRemoteSearch).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: false, items: mockMuscleGroups })
        )
    })

    it('renders editable search state and forwards search updates', () => {
        remoteSearchMocks.useRemoteSearch.mockReturnValueOnce({
            searchQuery: 'glu',
            setSearchQuery: remoteSearchMocks.setSearchQuery,
            isSearching: true,
            displayedItems: mockMuscleGroups,
        })

        renderSelector()

        const input = screen.getByPlaceholderText('Search muscle groups...')
        expect(input).toHaveValue('glu')
        expect(screen.getByTestId('mock-spinner')).toBeInTheDocument()
        expect(screen.getAllByTestId('mock-checkbox')).toHaveLength(2)

        fireEvent.change(input, { target: { value: 'glut' } })

        expect(
            remoteSearchMocks.setSearchQuery
        ).toHaveBeenCalledExactlyOnceWith('glut')
        expect(remoteSearchMocks.useRemoteSearch).toHaveBeenCalledWith(
            expect.objectContaining({ enabled: true, items: mockMuscleGroups })
        )
    })

    it('configures remote search callbacks for muscle groups', async () => {
        renderSelector()

        const props = getMockProps(remoteSearchMocks.useRemoteSearch) as {
            fallbackMessage: string
            search: (query: string, limit: number) => Promise<unknown>
            getItemId: (muscleGroup: MuscleGroupPublic) => number
            getResultId: (result: { id: number }) => number
        }

        expect(props.fallbackMessage).toBe('Failed to search muscle groups')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(props.getItemId(mockMuscleGroups[0]!)).toBe(10)
        expect(props.getResultId({ id: 99 })).toBe(99)

        await props.search('quad', 5)

        expect(
            vi.mocked(SearchService).searchMuscleGroups
        ).toHaveBeenCalledExactlyOnceWith({
            body: {
                query: 'quad',
                limit: 5,
            },
        })
    })

    it('forwards toggled muscle group ids in editable mode', () => {
        const onSelectedMuscleGroupIdsChange = vi.fn()

        renderSelector({ onSelectedMuscleGroupIdsChange })

        const checkboxes = screen.getAllByTestId('mock-checkbox')
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        fireEvent.click(checkboxes[1]!)

        expect(onSelectedMuscleGroupIdsChange).toHaveBeenCalledExactlyOnceWith([
            10, 20,
        ])
    })

    it('renders empty state when no muscle groups match search', () => {
        remoteSearchMocks.useRemoteSearch.mockReturnValueOnce({
            searchQuery: 'zzz',
            setSearchQuery: remoteSearchMocks.setSearchQuery,
            isSearching: false,
            displayedItems: [],
        })

        renderSelector()

        expect(screen.getByText('No muscle groups found.')).toBeInTheDocument()
    })
})
