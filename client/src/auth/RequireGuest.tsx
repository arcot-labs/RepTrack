import { useSession } from '@/auth/session'
import { Loading } from '@/components/Loading'
import type { LocationState } from '@/models/location'
import type { JSX } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export function RequireGuest({ children }: { children: JSX.Element }) {
    const { isLoading, isAuthenticated } = useSession()
    const location = useLocation()
    const state = location.state as LocationState | null
    if (isLoading) return <Loading />
    if (isAuthenticated) {
        const to = state?.from?.pathname ?? '/'
        return <Navigate to={to} replace />
    }
    return children
}
