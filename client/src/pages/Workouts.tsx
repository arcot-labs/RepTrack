import { WorkoutService, type WorkoutBase } from '@/api/generated'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { WorkoutsTable } from '@/components/workouts/WorkoutsTable'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function Workouts() {
    const [workouts, setWorkouts] = useState<WorkoutBase[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadWorkouts = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await WorkoutService.getWorkouts()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch workouts',
                })
                setWorkouts([])
                return
            }
            logger.info('Fetched workouts', data)
            setWorkouts(data)
        } finally {
            setIsLoading(false)
        }
    }

    const handleWorkoutDeleted = (workoutId: number) => {
        setWorkouts((prev) =>
            prev.filter((workout) => workout.id !== workoutId)
        )
    }

    useEffect(() => {
        void loadWorkouts()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workouts</CardTitle>
            </CardHeader>
            <CardContent>
                <WorkoutsTable
                    workouts={workouts}
                    isLoading={isLoading}
                    onWorkoutDeleted={handleWorkoutDeleted}
                    onReloadWorkouts={loadWorkouts}
                />
            </CardContent>
        </Card>
    )
}
