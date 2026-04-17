import { RequireAuth } from '@/auth/RequireAuth'
import type { SessionContextType } from '@/models/session'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()

vi.mock('@/auth/useSession', () => ({
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

describe('RequireAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useSessionMock.mockReturnValue(makeSession())
    })

    it('shows loading component while session loading', () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: true,
                isAuthenticated: false,
            })
        )

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

    it('redirects unauthenticated to /login with correct from path', () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: false,
            })
        )

        function LoginPage() {
            const location = useLocation()
            const fromPath =
                (location.state as { from?: { pathname?: string } } | null)
                    ?.from?.pathname ?? 'none'
            return <div>Login page from: {fromPath}</div>
        }

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
                    <Route path="/login" element={<LoginPage />} />
                </Routes>
            </MemoryRouter>
        )

        expect(
            screen.getByText('Login page from: /protected')
        ).toBeInTheDocument()
        expect(screen.queryByText('private')).not.toBeInTheDocument()
    })

    it('renders for non-admin when admin not required', () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
                user: { is_admin: false } as SessionContextType['user'],
            })
        )

        render(
            <MemoryRouter>
                <RequireAuth requireAdmin={false}>
                    <div>member area</div>
                </RequireAuth>
            </MemoryRouter>
        )

        expect(screen.getByText('member area')).toBeInTheDocument()
    })

    it('redirects non-admin when admin required', () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
                user: { is_admin: false } as SessionContextType['user'],
            })
        )

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

    it('renders for admin when admin required', () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
                user: { is_admin: true } as SessionContextType['user'],
            })
        )

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
