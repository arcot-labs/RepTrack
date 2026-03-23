import { useSession } from '@/auth/session'
import { HeaderActions } from '@/components/HeaderActions'
import { NavItem } from '@/lib/nav'
import { NavLink, Outlet } from 'react-router-dom'

export function AppLayout() {
    const { user } = useSession()

    return (
        <div className="flex min-h-screen flex-col bg-muted">
            <header className="border-b bg-background">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-baseline gap-4">
                        <NavLink to="/" className="text-2xl font-bold">
                            RepTrack
                        </NavLink>
                        <nav className="flex items-center gap-4">
                            <NavItem to="/">Dashboard</NavItem>
                            <NavItem to="/exercises">Exercises</NavItem>
                            <NavItem to="/docs">Docs</NavItem>
                            {user?.is_admin && (
                                <NavItem to="/admin">Admin</NavItem>
                            )}
                        </nav>
                    </div>
                    <HeaderActions />
                </div>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-6xl px-4 py-6">
                    <div className="rounded-lg bg-background p-6 shadow-md">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    )
}
