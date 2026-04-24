import {
    SearchService,
    type ExercisePublic,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { useExercisesTableController } from '@/components/exercises/useExercisesTableController'
import {
    getExerciseRowActionsConfig,
    getExerciseToolbarConfig,
    handleDeleteExercise,
} from '@/components/exercises/utils'
import { useDialog } from '@/components/useDialog'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    MenuItemConfig,
} from '@/models/data-table'
import type { ExerciseFormDialogMode } from '@/models/exercises-table'
import { getMockCallArg } from '@/tests/utils'
import { act, renderHook } from '@testing-library/react'
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
    getExerciseRowActionsConfig: vi.fn(),
    getExerciseToolbarConfig: vi.fn(),
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
const rowActionsMenuItemsMock =
    vi.fn<(row: ExercisePublic) => MenuItemConfig[]>()
const onCreateExerciseMock = vi.fn()

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
    remoteSearchMocks.useRemoteSearch.mockReturnValue({
        searchQuery: 'squat',
        setSearchQuery: remoteSearchMocks.setSearchQuery,
        isSearching: false,
        refreshSearchResults: remoteSearchMocks.refreshSearchResults,
        displayedItems: mockDisplayedExercises,
    })
    rowActionsMenuItemsMock.mockReturnValue([
        {
            type: 'action',
            label: 'View',
            onSelect: vi.fn(),
        },
    ])
    const rowActionsConfigMock: DataTableRowActionsConfig<ExercisePublic> = {
        schema: zExercisePublic,
        menuItems: rowActionsMenuItemsMock,
    }
    vi.mocked(getExerciseRowActionsConfig).mockReturnValue(rowActionsConfigMock)
    const toolbarConfigMock: DataTableToolbarConfig = {
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
        ],
        actions: [
            {
                label: 'Add Exercise',
                onClick: onCreateExerciseMock,
            },
        ],
        showViewOptions: true,
    }
    vi.mocked(getExerciseToolbarConfig).mockReturnValue(toolbarConfigMock)
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

        const props = getMockCallArg(remoteSearchMocks.useRemoteSearch) as {
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
        const props = getMockCallArg(
            vi.mocked(getExerciseRowActionsConfig)
        ) as {
            isRowLoading: (id: number) => boolean
            openDeleteDialog: (exercise: ExercisePublic) => void
            openFormDialog: (
                mode: ExerciseFormDialogMode,
                exercise?: ExercisePublic | null
            ) => void
        }

        expect(result.current.rowActionsConfig).toBe(
            vi.mocked(getExerciseRowActionsConfig).mock.results[0]?.value
        )
        expect(props.isRowLoading).toBe(isRowLoadingMock)
        expect(props.openDeleteDialog).toBe(dialogMocks.open)
        expect(props.openFormDialog).toEqual(expect.any(Function))
    })

    it('builds toolbar config from remote search state and muscle groups', () => {
        const { result } = renderUseExercisesTableController()
        const props = getMockCallArg(vi.mocked(getExerciseToolbarConfig)) as {
            searchQuery: string
            setSearchQuery: (value: string) => void
            isSearching: boolean
            muscleGroups: MuscleGroupPublic[]
            onCreateExercise: () => void
        }

        expect(result.current.toolbarConfig).toBe(
            vi.mocked(getExerciseToolbarConfig).mock.results[0]?.value
        )
        expect(props.searchQuery).toBe('squat')
        expect(props.setSearchQuery).toBe(remoteSearchMocks.setSearchQuery)
        expect(props.isSearching).toBe(false)
        expect(props.muscleGroups).toEqual(mockMuscleGroups)
        expect(props.onCreateExercise).toEqual(expect.any(Function))
    })

    it('wires delete dialog confirm callback to handleDeleteExercise', async () => {
        renderUseExercisesTableController()

        expect(useDialog).toHaveBeenCalledOnce()

        const onConfirm = getMockCallArg(dialogMocks.useDialog) as (
            exercise: ExercisePublic
        ) => Promise<void>
        expect(onConfirm).toBeTypeOf('function')

        await act(async () => {
            await onConfirm(mockExercise)
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

        const { onCreateExercise } = getMockCallArg(
            vi.mocked(getExerciseToolbarConfig)
        ) as { onCreateExercise: () => void }

        await act(async () => {
            onCreateExercise()
            await Promise.resolve()
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'create',
            exercise: null,
        })
    })

    it('opens form dialog for view, copy, and edit row actions', () => {
        const { result } = renderUseExercisesTableController()

        const { openFormDialog } = getMockCallArg(
            vi.mocked(getExerciseRowActionsConfig)
        ) as {
            openFormDialog: (
                mode: ExerciseFormDialogMode,
                exercise?: ExercisePublic | null
            ) => void
        }

        act(() => {
            openFormDialog('view', mockExercise)
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'view',
            exercise: mockExercise,
        })

        act(() => {
            openFormDialog('create', mockExercise)
        })

        expect(result.current.formDialog).toEqual({
            isOpen: true,
            mode: 'create',
            exercise: mockExercise,
        })

        act(() => {
            openFormDialog('edit', mockExercise)
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
