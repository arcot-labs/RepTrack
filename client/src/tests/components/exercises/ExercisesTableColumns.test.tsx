import { type ExercisePublic, type MuscleGroupPublic } from '@/api/generated'
import { getExerciseColumns } from '@/components/exercises/ExercisesTableColumns'
import { dash } from '@/lib/text'
import type { DataTableRowActionsConfig } from '@/models/data-table'
import {
    getColumn,
    hasAccessorFn,
    hasAccessorKey,
    hasFilterFn,
    hasGetUniqueValues,
    renderCell,
    testHeader,
} from '@/tests/components/utils'
import { getMockProps } from '@/tests/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const inlineRowActionsMock = vi.hoisted(() => vi.fn())
const truncatedCellMock = vi.hoisted(() => vi.fn())

vi.mock('@/components/data-table/DataTableInlineRowActions', () => ({
    DataTableInlineRowActions: (props: unknown) => {
        inlineRowActionsMock(props)
        return <div data-testid="mock-inline-row-actions" />
    },
}))

vi.mock('@/components/data-table/DataTableTruncatedCell', () => ({
    DataTableTruncatedCell: (props: unknown) => {
        truncatedCellMock(props)
        return <div data-testid="mock-truncated-cell" />
    },
}))

vi.mock('@/lib/datetime', () => ({
    formatNullableDateTime: (value?: string | null) =>
        `${String(value)} - formatNullableDateTime`,
}))

vi.mock('@/lib/text', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/text')>('@/lib/text')

    return {
        ...actual,
        capitalizeWords: vi.fn((value: string) => `${value} - capitalized`),
    }
})

vi.mock('@/components/exercises/utils', async () => {
    const actual = await vi.importActual<
        typeof import('@/components/exercises/utils')
    >('@/components/exercises/utils')

    return {
        ...actual,
        formatExerciseName: vi.fn(
            (exercise: ExercisePublic) => `${exercise.name} - formatted`
        ),
    }
})

const muscleGroup: MuscleGroupPublic = {
    id: 10,
    name: 'quads',
    description: 'Quadriceps muscles',
}

const customExercise: ExercisePublic = {
    id: 1,
    user_id: 2,
    name: 'back squat',
    description: 'Barbell squat',
    created_at: '2026-04-16T00:00:00Z',
    updated_at: '2026-04-17T00:00:00Z',
    muscle_groups: [muscleGroup],
}

const systemExercise: ExercisePublic = {
    id: 2,
    user_id: null,
    name: 'push up',
    description: null,
    created_at: '2026-04-18T00:00:00Z',
    updated_at: '2026-04-19T00:00:00Z',
    muscle_groups: [],
}

const menuItemsMock = vi.fn()

const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
    schema: {} as DataTableRowActionsConfig<ExercisePublic>['schema'],
    menuItems: menuItemsMock,
}

beforeEach(() => {
    vi.clearAllMocks()
    menuItemsMock.mockReturnValue([
        {
            type: 'action',
            label: 'View',
            onSelect: vi.fn(),
            disabled: false,
        },
    ])
})

describe('getExerciseColumns', () => {
    it('configures actions column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(cols, (c) => c.id === 'actions')

        testHeader(col, 'actions', 'Actions', false)

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByTestId('mock-inline-row-actions')
        ).toBeInTheDocument()
        expect(inlineRowActionsMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ row: { original: customExercise } })
        )

        const props = getMockProps(inlineRowActionsMock) as {
            row: { original: ExercisePublic }
            config: DataTableRowActionsConfig<ExercisePublic>
        }
        props.config.menuItems(props.row.original)

        expect(menuItemsMock).toHaveBeenCalledWith(customExercise)

        menuItemsMock.mockReturnValueOnce([])
        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures name column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'name'
        )

        testHeader(col, 'name', 'Name', false)

        const cell = renderCell(col, customExercise)
        expect(cell.getByText('back squat - formatted')).toBeInTheDocument()
        expect(cell.getByTestId('mock-truncated-cell')).toBeInTheDocument()
        expect(truncatedCellMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                value: 'back squat - formatted',
            })
        )
    })

    it('configures muscle groups column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(cols, (c) => c.id === 'muscle_groups')

        if (!hasAccessorFn(col))
            throw new Error('Muscle groups column does not have an accessorFn')
        expect(col.accessorFn(customExercise, 0)).toBe('quads')

        if (!hasGetUniqueValues(col))
            throw new Error(
                'Muscle groups column does not have getUniqueValues'
            )
        expect(col.getUniqueValues(customExercise)).toEqual(['10'])

        testHeader(col, 'muscle_groups', 'Muscle Groups', false)

        const customCell = renderCell(col, customExercise)
        expect(customCell.getByText('quads - capitalized')).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()

        if (!hasFilterFn(col))
            throw new Error('Muscle groups column does not have a filterFn')
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', ['10'])
        ).toBe(true)
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', ['99'])
        ).toBe(false)
        expect(
            col.filterFn({ original: customExercise }, 'muscle_groups', [])
        ).toBe(true)
    })

    it('configures description column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'description'
        )

        testHeader(col, 'description', 'Description', false)

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByTestId('mock-truncated-cell')
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures created at column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'created_at'
        )

        testHeader(col, 'created_at', 'Created At', false)

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByText(
                `${customExercise.created_at} - formatNullableDateTime`
            )
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures updated at column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'updated_at'
        )

        testHeader(col, 'updated_at', 'Updated At', false)

        const customCell = renderCell(col, customExercise)
        expect(
            customCell.getByText(
                `${customExercise.updated_at} - formatNullableDateTime`
            )
        ).toBeInTheDocument()

        const systemCell = renderCell(col, systemExercise)
        expect(systemCell.getByText(dash)).toBeInTheDocument()
    })

    it('configures virtual type column', () => {
        const cols = getExerciseColumns(rowActionsConfig)
        const col = getColumn(cols, (c) => c.id === 'type')

        if (!hasAccessorFn(col))
            throw new Error('Type column does not have an accessorFn')
        expect(col.accessorFn(systemExercise, 0)).toBe('system')
        expect(col.accessorFn(customExercise, 0)).toBe('custom')

        if (!hasFilterFn(col))
            throw new Error('Type column does not have a filterFn')
        const mockRow = {
            getValue: () => 'custom',
        }
        expect(col.filterFn(mockRow, 'type', ['custom'])).toBe(true)
        expect(col.filterFn(mockRow, 'type', ['system'])).toBe(false)
    })
})
