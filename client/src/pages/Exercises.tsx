import {
    type ExercisePublic,
    ExercisesService,
    type MuscleGroupPublic,
    MuscleGroupsService,
} from '@/api/generated'
import { ExercisesTable } from '@/components/exercises/ExercisesTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function Exercises() {
    const [exercises, setExercises] = useState<ExercisePublic[]>([])
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroupPublic[]>([])
    const [isLoadingExercises, setIsLoadingExercises] = useState(true)
    const [isLoadingMuscleGroups, setIsLoadingMuscleGroups] = useState(true)

    const loadExercises = async () => {
        setIsLoadingExercises(true)
        try {
            const { data, error } = await ExercisesService.getExercises()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch exercises',
                })
                setExercises([])
                return
            }
            logger.info('Fetched exercises', data)
            setExercises(data)
        } finally {
            setIsLoadingExercises(false)
        }
    }

    const loadMuscleGroups = async () => {
        setIsLoadingMuscleGroups(true)
        try {
            const { data, error } = await MuscleGroupsService.getMuscleGroups()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch muscle groups',
                })
                setMuscleGroups([])
                return
            }
            logger.info('Fetched muscle groups', data)
            setMuscleGroups(data)
        } finally {
            setIsLoadingMuscleGroups(false)
        }
    }

    useEffect(() => {
        void loadExercises()
        void loadMuscleGroups()
    }, [])

    return (
        <Card className="gap-2">
            <CardHeader>
                <CardTitle>
                    <h1 className="text-xl font-bold">Exercises</h1>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ExercisesTable
                    exercises={exercises}
                    muscleGroups={muscleGroups}
                    isLoading={isLoadingExercises || isLoadingMuscleGroups}
                    onReloadExercises={loadExercises}
                    onReloadMuscleGroups={loadMuscleGroups}
                />
            </CardContent>
        </Card>
    )
}
