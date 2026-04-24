import { UserService, type UserPublic } from '@/api/generated'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function useUsers() {
    const [users, setUsers] = useState<UserPublic[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const load = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await UserService.getUsers()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch users',
                })
                setUsers([])
                return
            }
            logger.info('Fetched users', data)
            setUsers(data)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load()
    }, [])

    return { users, isLoading }
}
