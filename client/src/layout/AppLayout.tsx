import { useSession } from '@/auth/session'
import { HeaderActions } from '@/components/HeaderActions'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/overrides/button'
import { NavItem } from '@/lib/nav'
import { Menu } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/exercises', label: 'Exercises' },
]

export function AppLayout() {
    const { user } = useSession()

    return (
        <div
            className="flex min-h-screen flex-col bg-muted"
            style={{ minHeight: 'min(100dvh, 100vh)' }}
        >
            <header className="bg-card">
                <div className="mx-auto flex h-14 items-center justify-between px-2 md:px-4">
                    <div className="flex items-baseline gap-4">
                        <NavLink to="/" className="text-2xl font-bold">
                            RepTrack
                        </NavLink>
                        <nav className="hidden items-center gap-4 md:flex">
                            {navLinks.map((link) => (
                                <NavItem key={link.to} to={link.to}>
                                    {link.label}
                                </NavItem>
                            ))}
                            {user?.is_admin && (
                                <NavItem to="/admin">Admin</NavItem>
                            )}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <Menu className="h-4 w-4" />
                                        <span className="sr-only">
                                            Open navigation
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {navLinks.map((link) => (
                                        <DropdownMenuItem key={link.to} asChild>
                                            <NavLink to={link.to}>
                                                {link.label}
                                            </NavLink>
                                        </DropdownMenuItem>
                                    ))}
                                    {user?.is_admin && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem asChild>
                                                <NavLink to="/admin">
                                                    Admin
                                                </NavLink>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <HeaderActions />
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <div className="mx-auto max-w-7xl p-0 md:p-4">
                    <Outlet />
                </div>
            </main>
            <footer className="bg-card text-xs text-muted-foreground">
                <div className="mx-auto flex justify-center p-2">
                    <div className="flex items-center gap-1">
                        <span>Built by</span>
                        <a
                            className="text-primary underline-offset-4 hover:underline"
                            href="https://github.com/arcot-labs/RepTrack"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Aditya
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
