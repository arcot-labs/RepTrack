import { type UserPublic, UserService } from '@/api/generated'
import { SessionContext } from '@/auth/session'
import { logger } from '@/lib/logger'
import { type ReactNode, useEffect, useState } from 'react'

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserPublic | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadSession = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await UserService.getCurrentUser()
            if (error) {
                setUser(null)
                return
            }
            logger.info('Fetched current user', data)
            setUser(data)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadSession()
    }, [])

    return (
        <SessionContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                refresh: loadSession,
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}
