import type { SessionContextType } from '@/models/session'
import { createContext, useContext } from 'react'

export const SessionContext = createContext<SessionContextType | null>(null)

export function useSession() {
    const ctx = useContext(SessionContext)
    if (!ctx) throw new Error('useSession must be used within SessionProvider')
    return ctx
}
