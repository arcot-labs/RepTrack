import type { SessionContextType } from '@/models/session'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()

vi.mock('@/auth/session', () => ({
    useSession: () => useSessionMock(),
}))

const makeSession = (
    overrides: Partial<SessionContextType> = {}
): SessionContextType => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    refresh: vi.fn().mockResolvedValue(undefined),
    ...overrides,
})

const loadRequireAuth = async () =>
    (await import('@/auth/RequireAuth')).RequireAuth

describe('RequireAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useSessionMock.mockReturnValue(makeSession())
    })

    it('shows loading component while session loading', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: true,
                isAuthenticated: false,
            })
        )

        const RequireAuth = await loadRequireAuth()

        render(
            <MemoryRouter>
                <RequireAuth requireAdmin={false}>
                    <div>secret</div>
                </RequireAuth>
            </MemoryRouter>
        )

        expect(screen.getByText('Loading...')).toBeInTheDocument()
        expect(screen.queryByText('secret')).not.toBeInTheDocument()
    })

    it('redirects unauthenticated users to /login', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: false,
            })
        )

        const RequireAuth = await loadRequireAuth()

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <RequireAuth requireAdmin={false}>
                                <div>private</div>
                            </RequireAuth>
                        }
                    />
                    <Route path="/login" element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('Login page')).toBeInTheDocument()
        expect(screen.queryByText('private')).not.toBeInTheDocument()
    })

    it('redirects non-admins when requireAdmin is enabled', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
                user: { is_admin: false } as SessionContextType['user'],
            })
        )

        const RequireAuth = await loadRequireAuth()

        render(
            <MemoryRouter initialEntries={['/admin']}>
                <Routes>
                    <Route
                        path="/admin"
                        element={
                            <RequireAuth requireAdmin>
                                <div>admin area</div>
                            </RequireAuth>
                        }
                    />
                    <Route path="/" element={<div>home</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('home')).toBeInTheDocument()
        expect(screen.queryByText('admin area')).not.toBeInTheDocument()
    })

    it('renders children when requirements are satisfied', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
                user: { is_admin: true } as SessionContextType['user'],
            })
        )

        const RequireAuth = await loadRequireAuth()

        render(
            <MemoryRouter>
                <RequireAuth requireAdmin>
                    <div>admin area</div>
                </RequireAuth>
            </MemoryRouter>
        )

        expect(screen.getByText('admin area')).toBeInTheDocument()
    })
})
