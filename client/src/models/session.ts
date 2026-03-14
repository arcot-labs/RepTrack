import type { UserPublic } from '@/api/generated'

export interface SessionContextType {
    user: UserPublic | null
    isLoading: boolean
    authenticated: boolean
    refresh: () => Promise<void>
}
