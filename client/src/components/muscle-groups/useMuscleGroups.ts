import { MuscleGroupService, type MuscleGroupPublic } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function useMuscleGroups() {
    const [muscleGroups, setMuscleGroups] = useState<MuscleGroupPublic[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const load = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await MuscleGroupService.getMuscleGroups()
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
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [])

    return { muscleGroups, isLoading, reload: load }
}
