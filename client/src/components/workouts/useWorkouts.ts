import { WorkoutService, type WorkoutBase } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function useWorkouts() {
    const [workouts, setWorkouts] = useState<WorkoutBase[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const load = async () => {
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

    const remove = (id: number) => {
        setWorkouts((prev) => prev.filter((w) => w.id !== id))
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [])

    return {
        workouts,
        isLoading,
        reload: load,
        remove,
    }
}
