import type { UserPublic } from '@/api/generated'

export interface SessionContextType {
    user: UserPublic | null
    isLoading: boolean
    isAuthenticated: boolean
    refresh: () => Promise<void>
}
