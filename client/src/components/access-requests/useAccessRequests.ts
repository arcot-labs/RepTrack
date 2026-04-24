import { type AccessRequestPublic, AccessRequestService } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function useAccessRequests() {
    const [requests, setRequests] = useState<AccessRequestPublic[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const load = async () => {
        setIsLoading(true)
        try {
            const { data, error } =
                await AccessRequestService.getAccessRequests()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch access requests',
                })
                setRequests([])
                return
            }
            logger.info('Fetched access requests', data)
            setRequests(data)
        } finally {
            setIsLoading(false)
        }
    }

    const update = (req: AccessRequestPublic) => {
        setRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)))
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [])

    return { requests, isLoading, reload: load, update }
}
