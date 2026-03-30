import {
    ExerciseService,
    SearchService,
    type ExercisePublic,
    type ExerciseSearchResult,
    type MuscleGroupPublic,
} from '@/api/generated'
import { zExercisePublic } from '@/api/generated/zod.gen'
import { DataTable } from '@/components/data-table/DataTable'
import { DataTableColumnHeader } from '@/components/data-table/DataTableColumnHeader'
import { DataTableInlineRowActions } from '@/components/data-table/DataTableInlineRowActions'
import { DataTableTruncatedCell } from '@/components/data-table/DataTableTruncatedCell'
import { ExerciseFormDialog } from '@/components/exercises/ExerciseFormDialog'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/overrides/button'
import { handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import { blueText, redText } from '@/lib/styles'
import { capitalizeWords } from '@/lib/text'
import type {
    DataTableRowActionsConfig,
    DataTableToolbarConfig,
    FilterOption,
} from '@/models/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Copy, Eye, Pencil, Plus, Trash } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

function getTypeFilterOptions(): FilterOption[] {
    return [
        { label: 'System', value: 'system' },
        { label: 'Custom', value: 'custom' },
    ]
}

interface ExercisesTableProps {
    exercises: ExercisePublic[]
    muscleGroups: MuscleGroupPublic[]
    isLoading: boolean
    onReloadExercises: () => Promise<void>
    onReloadMuscleGroups: () => Promise<void>
}

export function ExercisesTable({
    exercises,
    muscleGroups,
    isLoading,
    onReloadExercises,
    onReloadMuscleGroups,
}: ExercisesTableProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<
        ExerciseSearchResult[] | null
    >(null)
    const [searchRefreshTick, setSearchRefreshTick] = useState(0)
    const searchRequestIdRef = useRef(0)

    const [isLoadingExerciseIds, setIsLoadingExerciseIds] = useState<
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
        Set<number>
    >(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const [formDialog, setFormDialog] = useState<{
        isOpen: boolean
        mode: 'create' | 'edit' | 'view'
        exercise: ExercisePublic | null
    }>({
        isOpen: false,
        mode: 'create',
        exercise: null,
    })

    const [deleteDialog, setDeleteDialog] = useState<{
        isOpen: boolean
        exercise: ExercisePublic | null
    }>({
        isOpen: false,
        exercise: null,
    })

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim())
        }, 300)
        return () => {
            clearTimeout(timeout)
        }
    }, [searchQuery])

    useEffect(() => {
        if (!debouncedSearchQuery) {
            searchRequestIdRef.current += 1
            setSearchResults(null)
            setIsSearching(false)
            return
        }
        const requestId = searchRequestIdRef.current + 1
        searchRequestIdRef.current = requestId
        setIsSearching(true)
        void (async () => {
            const { data, error } = await SearchService.searchExercises({
                body: {
                    query: debouncedSearchQuery,
                    limit: exercises.length,
                },
            })
            // only update results for latest request
            if (requestId !== searchRequestIdRef.current) return
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to search exercises',
                })
                setSearchResults(null)
                return
            }
            setSearchResults(data)
        })().finally(() => {
            if (requestId === searchRequestIdRef.current) setIsSearching(false)
        })
    }, [debouncedSearchQuery, exercises.length, searchRefreshTick])

    const refreshSearchResults = () => {
        if (!debouncedSearchQuery) return
        setSearchRefreshTick((prev) => prev + 1)
    }

    const displayedExercises = useMemo(() => {
        if (!searchResults) return exercises
        const byId = new Map(
            exercises.map((exercise) => [exercise.id, exercise])
        )
        return searchResults
            .map((hit) => byId.get(hit.id))
            .filter((exercise): exercise is ExercisePublic => !!exercise)
    }, [exercises, searchResults])

    const openCreateDialog = (exercise?: ExercisePublic) => {
        setFormDialog({
            isOpen: true,
            mode: 'create',
            exercise: exercise ?? null,
        })
    }

    const openEditDialog = (exercise: ExercisePublic) => {
        setFormDialog({ isOpen: true, mode: 'edit', exercise })
    }

    const openViewDialog = (exercise: ExercisePublic) => {
        setFormDialog({ isOpen: true, mode: 'view', exercise })
    }

    const openDeleteDialog = (exercise: ExercisePublic) => {
        setDeleteDialog({ isOpen: true, exercise })
    }

    const closeDeleteDialog = () => {
        setDeleteDialog({ isOpen: false, exercise: null })
    }

    const setExerciseRowLoading = (exerciseId: number, isLoading: boolean) => {
        setIsLoadingExerciseIds((prev) => {
            const next = new Set(prev)
            if (isLoading) next.add(exerciseId)
            else next.delete(exerciseId)
            return next
        })
    }

    const handleDeleteExercise = async () => {
        const exercise = deleteDialog.exercise
        if (!exercise) return

        setIsDeleting(true)
        setExerciseRowLoading(exercise.id, true)
        try {
            const { error } = await ExerciseService.deleteExercise({
                path: { exercise_id: exercise.id },
            })
            if (error) {
                await handleApiError(error, {
                    httpErrorHandlers: {
                        exercise_update_not_allowed: async () => {
                            notify.error(
                                'You cannot delete this exercise. Reloading data'
                            )
                            await onReloadExercises()
                        },
                        exercise_not_found: async () => {
                            notify.error(
                                'Exercise no longer exists. Reloading data'
                            )
                            await onReloadExercises()
                        },
                    },
                    fallbackMessage: 'Failed to delete exercise',
                })
                closeDeleteDialog()
                return
            }
            notify.success('Exercise deleted')
            await onReloadExercises()
            refreshSearchResults()
            closeDeleteDialog()
        } finally {
            setExerciseRowLoading(exercise.id, false)
            setIsDeleting(false)
        }
    }

    const rowActionsConfig: DataTableRowActionsConfig<ExercisePublic> = {
        schema: zExercisePublic,
        menuItems: (row) => {
            if (row.user_id === null)
                return [
                    {
                        type: 'action',
                        icon: Eye,
                        onSelect: () => {
                            openViewDialog(row)
                        },
                    },
                    {
                        type: 'action',
                        className: blueText,
                        icon: Copy,
                        onSelect: () => {
                            openCreateDialog(row)
                        },
                    },
                ]

            const isRowLoading = isLoadingExerciseIds.has(row.id)
            return [
                {
                    type: 'action',
                    icon: Pencil,
                    onSelect: () => {
                        openEditDialog(row)
                    },
                    disabled: isRowLoading,
                },
                {
                    type: 'action',
                    className: blueText,
                    icon: Copy,
                    onSelect: () => {
                        openCreateDialog(row)
                    },
                },
                {
                    type: 'action',
                    className: redText,
                    icon: Trash,
                    onSelect: () => {
                        openDeleteDialog(row)
                    },
                },
            ]
        },
    }

    const columns: ColumnDef<ExercisePublic>[] = [
        {
            id: 'actions',
            header: ({ column }) => (
                <DataTableColumnHeader
                    column={column}
                    title="Actions"
                    className="justify-center"
                />
            ),
            cell: ({ row }) => {
                const menuItems = rowActionsConfig.menuItems(row.original)
                return menuItems.length > 0 ? (
                    <DataTableInlineRowActions
                        row={row}
                        config={rowActionsConfig}
                    />
                ) : (
                    <div className="text-center">—</div>
                )
            },
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <>
                    <span className="inline md:hidden">
                        {capitalizeWords(row.original.name)}
                    </span>
                    <span className="hidden md:inline">
                        <DataTableTruncatedCell
                            value={capitalizeWords(row.original.name)}
                            className="max-w-50 min-w-25"
                        />
                    </span>
                </>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'description',
            meta: {
                headerClassName: 'hidden md:table-cell',
                cellClassName: 'hidden md:table-cell',
            },
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Description" />
            ),
            cell: ({ row }) =>
                row.original.description ? (
                    <DataTableTruncatedCell
                        value={row.original.description}
                        className="max-w-100 min-w-25 lg:max-w-150"
                    />
                ) : (
                    '—'
                ),
            enableHiding: true,
        },
        {
            id: 'muscle_groups',
            meta: { viewLabel: 'Muscle Groups' },
            accessorFn: (row) =>
                row.muscle_groups
                    .map((group) => capitalizeWords(group.name))
                    .join(', '),
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Muscle Groups" />
            ),
            cell: ({ row }) => {
                const names = row.original.muscle_groups.map((group) =>
                    capitalizeWords(group.name)
                )
                return names.length ? (
                    <>
                        <span className="inline md:hidden">
                            {names.join(', ')}
                        </span>
                        <span className="hidden md:inline">
                            <DataTableTruncatedCell
                                value={names.join(', ')}
                                className="max-w-100 min-w-25"
                            />
                        </span>
                    </>
                ) : (
                    '—'
                )
            },
            filterFn: (row, _id, filterValues: string[]) => {
                if (!filterValues.length) return true
                const rowGroupIds = new Set(
                    row.original.muscle_groups.map((group) => String(group.id))
                )
                return filterValues.every((groupId) => rowGroupIds.has(groupId))
            },
            enableHiding: true,
        },
        {
            id: 'type',
            meta: { filterOnly: true },
            accessorFn: (row) => (row.user_id === null ? 'system' : 'custom'),
            filterFn: (row, id, filterValues: string[]) =>
                filterValues.includes(row.getValue(id)),
        },
    ]

    const toolbarConfig: DataTableToolbarConfig = {
        search: {
            columnId: 'name',
            placeholder: 'Search exercises...',
            value: searchQuery,
            onChange: setSearchQuery,
            isLoading: isSearching,
        },
        filters: [
            {
                columnId: 'type',
                title: 'Type',
                options: getTypeFilterOptions(),
            },
            {
                columnId: 'muscle_groups',
                title: 'Muscle Groups',
                options: muscleGroups.map((group) => ({
                    label: capitalizeWords(group.name),
                    value: String(group.id),
                })),
            },
        ],
        actions: [
            {
                label: 'Add Exercise',
                icon: Plus,
                onClick: () => {
                    openCreateDialog()
                },
            },
        ],
        showViewOptions: true,
    }

    return (
        <>
            <DataTable
                data={displayedExercises}
                columns={columns}
                pageSize={10}
                isLoading={isLoading}
                toolbarConfig={toolbarConfig}
                initialColumnVisibility={{ type: false }}
            />
            <ExerciseFormDialog
                open={formDialog.isOpen}
                mode={formDialog.mode}
                exercise={formDialog.exercise}
                muscleGroups={muscleGroups}
                isRowLoading={isLoadingExerciseIds.has(
                    formDialog.exercise?.id ?? -1
                )}
                onOpenChange={(isOpen) => {
                    setFormDialog((prev) => ({ ...prev, isOpen }))
                }}
                onSuccess={async () => {
                    await onReloadExercises()
                    refreshSearchResults()
                }}
                onReloadExercises={onReloadExercises}
                onReloadMuscleGroups={onReloadMuscleGroups}
                onRowLoadingChange={setExerciseRowLoading}
            />
            <Dialog
                open={deleteDialog.isOpen}
                onOpenChange={(isOpen) => {
                    if (!isDeleting) {
                        setDeleteDialog((prev) => ({ ...prev, isOpen }))
                    }
                }}
            >
                <DialogContent aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Delete Exercise</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold">
                            {deleteDialog.exercise?.name}
                        </span>
                        ?
                        <div className="mt-2">This action is irreversible.</div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={closeDeleteDialog}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => void handleDeleteExercise()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
