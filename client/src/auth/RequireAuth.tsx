import { useSession } from '@/auth/useSession'
import { Loading } from '@/components/Loading'
import { type JSX } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface RequireAuthProps {
    children: JSX.Element
    requireAdmin: boolean
}

export function RequireAuth({ children, requireAdmin }: RequireAuthProps) {
    const { isLoading, isAuthenticated, user } = useSession()
    const location = useLocation()
    if (isLoading) return <Loading />
    if (!isAuthenticated)
        return <Navigate to="/login" replace state={{ from: location }} />
    if (requireAdmin && !user?.is_admin) return <Navigate to="/" replace />
    return children
}
