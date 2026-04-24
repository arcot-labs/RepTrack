import { ExerciseService, type ExercisePublic } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function useExercises() {
    const [exercises, setExercises] = useState<ExercisePublic[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const load = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await ExerciseService.getExercises()
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
            setIsLoading(false)
        }
    }

    const remove = (id: number) => {
        setExercises((prev) => prev.filter((e) => e.id !== id))
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [])

    return { exercises, isLoading, reload: load, remove }
}
