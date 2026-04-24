import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { useWorkouts } from '@/components/workouts/useWorkouts'
import { WorkoutsTable } from '@/components/workouts/WorkoutsTable'

export function Workouts() {
    const { workouts, isLoading, reload, remove } = useWorkouts()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workouts</CardTitle>
            </CardHeader>
            <CardContent>
                <WorkoutsTable
                    workouts={workouts}
                    isLoading={isLoading}
                    onWorkoutDeleted={remove}
                    onReloadWorkouts={reload}
                />
            </CardContent>
        </Card>
    )
}
