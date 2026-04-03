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

const loadRequireGuest = async () =>
    (await import('@/auth/RequireGuest')).RequireGuest

describe('RequireGuest', () => {
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

        const RequireGuest = await loadRequireGuest()

        render(
            <MemoryRouter>
                <RequireGuest>
                    <div>guest</div>
                </RequireGuest>
            </MemoryRouter>
        )

        expect(screen.getByText('Loading...')).toBeInTheDocument()
        expect(screen.queryByText('guest')).not.toBeInTheDocument()
    })

    it('redirects authenticated users to root path when no return state is provided', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
            })
        )

        const RequireGuest = await loadRequireGuest()

        render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <RequireGuest>
                                <div>guest</div>
                            </RequireGuest>
                        }
                    />
                    <Route path="/" element={<div>home</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('home')).toBeInTheDocument()
        expect(screen.queryByText('guest')).not.toBeInTheDocument()
    })

    it('redirects authenticated users back to page stored in state', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
            })
        )

        const RequireGuest = await loadRequireGuest()

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/login',
                        state: { from: { pathname: '/secret' } },
                    },
                ]}
            >
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <RequireGuest>
                                <div>guest</div>
                            </RequireGuest>
                        }
                    />
                    <Route path="/secret" element={<div>secret page</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('secret page')).toBeInTheDocument()
        expect(screen.queryByText('guest')).not.toBeInTheDocument()
    })

    it('falls back to root when return state exists without pathname', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: true,
            })
        )

        const RequireGuest = await loadRequireGuest()

        render(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: '/login',
                        state: { from: {} },
                    },
                ]}
            >
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <RequireGuest>
                                <div>guest</div>
                            </RequireGuest>
                        }
                    />
                    <Route path="/" element={<div>home</div>} />
                </Routes>
            </MemoryRouter>
        )

        expect(screen.getByText('home')).toBeInTheDocument()
        expect(screen.queryByText('guest')).not.toBeInTheDocument()
    })

    it('shows children for unauthenticated users', async () => {
        useSessionMock.mockReturnValue(
            makeSession({
                isLoading: false,
                isAuthenticated: false,
            })
        )
        const RequireGuest = await loadRequireGuest()

        render(
            <MemoryRouter>
                <RequireGuest>
                    <div>guest area</div>
                </RequireGuest>
            </MemoryRouter>
        )

        expect(screen.getByText('guest area')).toBeInTheDocument()
    })
})
