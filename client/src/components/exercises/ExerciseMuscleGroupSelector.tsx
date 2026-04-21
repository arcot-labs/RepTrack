import { SearchService, type MuscleGroupPublic } from '@/api/generated'
import {
    getSelectedExerciseMuscleGroups,
    getToggledMuscleGroupIds,
} from '@/components/exercises/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useRemoteSearch } from '@/components/useRemoteSearch'
import { capitalizeWords, dash } from '@/lib/text'

interface ExerciseMuscleGroupSelectorProps {
    open: boolean
    readOnly: boolean
    muscleGroups: MuscleGroupPublic[]
    selectedMuscleGroupIds: number[]
    disabled: boolean
    onSelectedMuscleGroupIdsChange: (muscleGroupIds: number[]) => void
}

export function ExerciseMuscleGroupSelector({
    open,
    readOnly,
    muscleGroups,
    selectedMuscleGroupIds,
    disabled,
    onSelectedMuscleGroupIdsChange,
}: ExerciseMuscleGroupSelectorProps) {
    const {
        searchQuery,
        setSearchQuery,
        isSearching,
        displayedItems: displayedMuscleGroups,
    } = useRemoteSearch({
        items: muscleGroups,
        enabled: open && !readOnly,
        fallbackMessage: 'Failed to search muscle groups',
        search: (query, limit) =>
            SearchService.searchMuscleGroups({
                body: {
                    query,
                    limit,
                },
            }),
        getItemId: (muscleGroup) => muscleGroup.id,
        getResultId: (searchResult) => searchResult.id,
    })

    const selectedMuscleGroups = getSelectedExerciseMuscleGroups(
        muscleGroups,
        selectedMuscleGroupIds
    )

    const toggleMuscleGroup = (muscleGroupId: number, checked: boolean) => {
        const muscleGroupIds = getToggledMuscleGroupIds(
            selectedMuscleGroupIds,
            muscleGroupId,
            checked
        )
        onSelectedMuscleGroupIdsChange(muscleGroupIds)
    }

    if (readOnly) {
        if (!selectedMuscleGroups.length)
            return <span className="text-sm text-muted-foreground">{dash}</span>

        return (
            <div className="flex flex-wrap gap-1">
                {selectedMuscleGroups.map((group) => (
                    <span
                        key={group.id}
                        className="rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground"
                    >
                        {capitalizeWords(group.name)}
                    </span>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="relative">
                <Input
                    placeholder="Search muscle groups..."
                    value={searchQuery}
                    onChange={(event) => {
                        setSearchQuery(event.target.value)
                    }}
                    className={isSearching ? 'pr-8' : ''}
                />
                {isSearching && (
                    <Spinner className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground" />
                )}
            </div>
            <div className="max-h-50 space-y-2 overflow-y-auto rounded-md border p-3">
                {displayedMuscleGroups.length ? (
                    displayedMuscleGroups.map((group) => {
                        const checked = selectedMuscleGroupIds.includes(
                            group.id
                        )
                        return (
                            <label
                                key={group.id}
                                className="flex cursor-pointer gap-2"
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(value) => {
                                        toggleMuscleGroup(
                                            group.id,
                                            value === true
                                        )
                                    }}
                                    disabled={disabled}
                                />
                                <span className="text-sm">
                                    <span className="font-medium">
                                        {capitalizeWords(group.name)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {' '}
                                        &mdash; {group.description}
                                    </span>
                                </span>
                            </label>
                        )
                    })
                ) : (
                    <div className="text-sm text-muted-foreground">
                        No muscle groups found.
                    </div>
                )}
            </div>
        </div>
    )
}
