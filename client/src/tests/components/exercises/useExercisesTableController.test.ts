import {
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { useExercisesTableController } from '@/components/exercises/useExercisesTableController'
import {
    getExerciseRowActions,
    handleDeleteExercise,
} from '@/components/exercises/utils'
import { useDialog } from '@/components/useDialog'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import { getMockProps } from '@/tests/utils'
import { act, renderHook } from '@testing-library/react'
import { Plus } from 'lucide-react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dialogMocks = vi.hoisted(() => ({
    open: vi.fn(),
    close: vi.fn(),
    confirm: vi.fn(),
    useDialog: vi.fn(),
}))

const remoteSearchMocks = vi.hoisted(() => ({
    refreshSearchResults: vi.fn(),
    setSearchQuery: vi.fn(),
    useRemoteSearch: vi.fn(),
}))

vi.mock('@/components/useDialog', () => ({
    useDialog: dialogMocks.useDialog,
}))

vi.mock('@/components/useRemoteSearch', () => ({
    useRemoteSearch: remoteSearchMocks.useRemoteSearch,
}))

vi.mock('@/components/exercises/utils', () => ({
    handleDeleteExercise: vi.fn(),
    getExerciseRowActions: vi.fn(),
}))

vi.mock('@/lib/text', () => ({
    capitalizeWords: vi.fn((value: string) => `${value} - capitalized`),
}))

vi.mock('@/api/generated', () => ({
    SearchService: {
        searchExercises: vi.fn(),
    },
}))

const mockExercise: ExercisePublic = {
    id: 1,
    user_id: 2,
    name: 'Back Squat',
    description: 'Barbell squat',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
    muscle_groups: [],
}

const mockDisplayedExercises: ExercisePublic[] = [mockExercise]

const mockMuscleGroups: MuscleGroupPublic[] = [
    {
        id: 10,
        name: 'quads',
        description: 'Quadriceps muscles',
    },
]

const onExerciseDeletedMock = vi.fn()
const onReloadExercisesMock = vi.fn().mockResolvedValue(undefined)
const onReloadMuscleGroupsMock = vi.fn().mockResolvedValue(undefined)
const setRowLoadingMock = vi.fn()
const isRowLoadingMock = vi.fn(() => false)

const renderUseExercisesTableController = () =>
    renderHook(() =>
        useExercisesTableController({
            exercises: [mockExercise],
            muscleGroups: mockMuscleGroups,
            isRowLoading: isRowLoadingMock,
            onExerciseDeleted: onExerciseDeletedMock,
            onReloadExercises: onReloadExercisesMock,
            onReloadMuscleGroups: onReloadMuscleGroupsMock,
            setRowLoading: setRowLoadingMock,
        })
    )

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(SearchService).searchExercises.mockResolvedValue({
        data: [],
        error: undefined,
    } as never)
    vi.mocked(getExerciseRowActions).mockReturnValue([
        {
            type: 'action',
            label: 'View',
            onSelect: vi.fn(),
        },
    ])
    remoteSearchMocks.useRemoteSearch.mockReturnValue({
        searchQuery: 'squat',
        setSearchQuery: remoteSearchMocks.setSearchQuery,
        isSearching: false,
        refreshSearchResults: remoteSearchMocks.refreshSearchResults,
        displayedItems: mockDisplayedExercises,
    })
    dialogMocks.useDialog.mockReturnValue({
        state: {
            isOpen: false,
            isConfirming: false,
            args: [mockExercise],
        },
        open: dialogMocks.open,
        close: dialogMocks.close,
        confirm: dialogMocks.confirm,
    })
})

describe('useExercisesTableController', () => {
    it('configures remote search with exercise-specific settings', async () => {
        renderUseExercisesTableController()

        expect(useRemoteSearch).toHaveBeenCalledOnce()

        const props = getMockProps(remoteSearchMocks.useRemoteSearch) as {
            items: ExercisePublic[]
            fallbackMessage: string
            search: (query: string, limit: number) => Promise<unknown>
            getItemId: (exercise: ExercisePublic) => number
            getResultId: (result: { id: number }) => number
        }

        expect(props.items).toEqual([mockExercise])
        expect(props.fallbackMessage).toBe('Failed to search exercises')
        expect(props.getItemId(mockExercise)).toBe(mockExercise.id)
        expect(props.getResultId({ id: 99 })).toBe(99)

        await props.search('bench', 5)

        expect(
            vi.mocked(SearchService).searchExercises
        ).toHaveBeenCalledExactlyOnceWith({
            body: {
                query: 'bench',
                limit: 5,
            },
        })
    })

    it('builds row actions config from row loading state and dialog handlers', () => {
        const { result } = renderUseExercisesTableController()

        const menuItems =
            result.current.rowActionsConfig.menuItems(mockExercise)

        expect(menuItems).toHaveLength(1)
        expect(result.current.rowActionsConfig.schema).toBe(zExercisePublic)
        expect(isRowLoadingMock).toHaveBeenCalledExactlyOnceWith(
            mockExercise.id
        )
        expect(getExerciseRowActions).toHaveBeenCalledExactlyOnceWith(
            mockExercise,
            false,
            expect.any(Function),
            expect.any(Function),
            expect.any(Function),
            dialogMocks.open
        )
    })

    it('builds toolbar config from remote search state and muscle groups', () => {
        const { result } = renderUseExercisesTableController()

        expect(result.current.toolbarConfig).toMatchObject({
            search: {
                placeholder: 'Search exercises...',
                value: 'squat',
                onChange: remoteSearchMocks.setSearchQuery,
                isLoading: false,
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
            actions: [
                {
                    label: 'Add Exercise',
                    icon: Plus,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    onClick: expect.any(Function),
                },
            ],
            showViewOptions: true,
        })
    })

    it('wires delete dialog confirm callback to handleDeleteExercise', async () => {
        renderUseExercisesTableController()

        expect(useDialog).toHaveBeenCalledOnce()

        const onConfirm = getMockProps(dialogMocks.useDialog)
        expect(onConfirm).toBeTypeOf('function')

        await act(async () => {
            // @ts-expect-error onConfirm is typed correctly
            onConfirm(mockExercise)
            await Promise.resolve()
        })

        expect(handleDeleteExercise).toHaveBeenCalledExactlyOnceWith(
            mockExercise.id,
            onExerciseDeletedMock,
            remoteSearchMocks.refreshSearchResults,
            onReloadExercisesMock,
            setRowLoadingMock
        )
    })

    it('returns delete dialog controller from useDialog', () => {
        const { result } = renderUseExercisesTableController()

        expect(result.current.deleteDialog).toMatchObject({
            state: {
                isOpen: false,
                isConfirming: false,
                args: [mockExercise],
            },
            open: dialogMocks.open,
            close: dialogMocks.close,
            confirm: dialogMocks.confirm,
        })
    })

    it('opens form dialog in create mode from toolbar action', async () => {
        const { result } = renderUseExercisesTableController()

        await act(async () => {
            await result.current.toolbarConfig.actions?.[0]?.onClick()
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'create',
            exercise: null,
        })
    })

    it('opens form dialog for view, copy, and edit row actions', () => {
        const { result } = renderUseExercisesTableController()

        result.current.rowActionsConfig.menuItems(mockExercise)

        const [, , openViewDialog, openCopyDialog, openEditDialog] = vi.mocked(
            getExerciseRowActions
        ).mock.calls[0] as [
            ExercisePublic,
            boolean,
            (exercise: ExercisePublic) => void,
            (exercise: ExercisePublic) => void,
            (exercise: ExercisePublic) => void,
            (exercise: ExercisePublic) => void,
        ]

        act(() => {
            openViewDialog(mockExercise)
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'view',
            exercise: mockExercise,
        })

        act(() => {
            openCopyDialog(mockExercise)
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'create',
            exercise: mockExercise,
        })

        act(() => {
            openEditDialog(mockExercise)
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'edit',
            exercise: mockExercise,
        })
    })

    it('updates form dialog open state through onExerciseFormOpenChange', () => {
        const { result } = renderUseExercisesTableController()

        act(() => {
            result.current.onExerciseFormOpenChange(true)
        })

        expect(result.current.formDialog.isOpen).toBe(true)

        act(() => {
            result.current.onExerciseFormOpenChange(false)
        })

        expect(result.current.formDialog.isOpen).toBe(false)
    })

    it('reloads exercises and refreshes search results on form success', async () => {
        const { result } = renderUseExercisesTableController()

        await act(async () => {
            await result.current.onExerciseFormSuccess()
        })

        expect(onReloadExercisesMock).toHaveBeenCalledOnce()
        expect(remoteSearchMocks.refreshSearchResults).toHaveBeenCalledOnce()
    })

    it('returns displayed exercises and reload callbacks', () => {
        const { result } = renderUseExercisesTableController()

        expect(result.current.displayedExercises).toEqual(
            mockDisplayedExercises
        )
        expect(result.current.onReloadExercises).toBe(onReloadExercisesMock)
        expect(result.current.onReloadMuscleGroups).toBe(
            onReloadMuscleGroupsMock
        )
    })
})
