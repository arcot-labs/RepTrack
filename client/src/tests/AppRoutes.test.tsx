import { AppRoutes } from '@/AppRoutes'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireAuthMock = vi.hoisted(() => vi.fn())
const requireGuestMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth/RequireAuth', () => ({
    RequireAuth: ({
        children,
        requireAdmin,
    }: {
        children: ReactNode
        requireAdmin?: boolean
    }) => {
        requireAuthMock({ children, requireAdmin })
        return <>{children}</>
    },
}))

vi.mock('@/auth/RequireGuest', () => ({
    RequireGuest: ({ children }: { children: ReactNode }) => {
        requireGuestMock({ children })
        return <>{children}</>
    },
}))

vi.mock('@/layout/AppLayout', async () => {
    const { Outlet } = await import('react-router-dom')

    return {
        AppLayout: () => (
            <div data-testid="app-layout">
                layout
                <Outlet />
            </div>
        ),
    }
})

function stubPage(name: string) {
    return () => <div>{name}</div>
}

vi.mock('@/pages/Dashboard', () => ({ Dashboard: stubPage('Dashboard page') }))
vi.mock('@/pages/Exercises', () => ({ Exercises: stubPage('Exercises page') }))
vi.mock('@/pages/Workouts', () => ({ Workouts: stubPage('Workouts page') }))
vi.mock('@/pages/Docs', async () => {
    const { Outlet } = await import('react-router-dom')

    return {
        Docs: () => (
            <div data-testid="docs-layout">
                <Outlet />
            </div>
        ),
    }
})
vi.mock('@/components/docs/DocsIndex', () => ({
    DocsIndex: stubPage('Docs index'),
}))
vi.mock('@/components/docs/Doc', () => ({ Doc: stubPage('Doc detail') }))
vi.mock('@/pages/Admin', () => ({ Admin: stubPage('Admin page') }))

vi.mock('@/pages/RequestAccess', () => ({
    RequestAccess: stubPage('Request access page'),
}))
vi.mock('@/pages/Register', () => ({ Register: stubPage('Register page') }))
vi.mock('@/pages/ForgotPassword', () => ({
    ForgotPassword: stubPage('Forgot password page'),
}))
vi.mock('@/pages/ResetPassword', () => ({
    ResetPassword: stubPage('Reset password page'),
}))
vi.mock('@/pages/Login', () => ({ Login: stubPage('Login page') }))

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
        </MemoryRouter>
    )
}

describe('AppRoutes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders dashboard inside layout', async () => {
        renderAt('/')

        expect(await screen.findByTestId('app-layout')).toBeInTheDocument()
        expect(await screen.findByText('Dashboard page')).toBeInTheDocument()
        expect(requireAuthMock).toHaveBeenCalledWith(
            expect.objectContaining({ requireAdmin: false })
        )
        expect(requireGuestMock).not.toHaveBeenCalled()
    })

    it.each([
        ['/exercises', 'Exercises page'],
        ['/workouts', 'Workouts page'],
    ])('renders %s inside layout', async (path, pageText) => {
        renderAt(path)

        expect(await screen.findByTestId('app-layout')).toBeInTheDocument()
        expect(await screen.findByText(pageText)).toBeInTheDocument()
        expect(requireAuthMock).toHaveBeenCalled()
        expect(requireGuestMock).not.toHaveBeenCalled()
    })

    it('renders docs index route inside docs layout', async () => {
        renderAt('/docs')

        expect(await screen.findByTestId('app-layout')).toBeInTheDocument()
        expect(await screen.findByTestId('docs-layout')).toBeInTheDocument()
        expect(await screen.findByText('Docs index')).toBeInTheDocument()
    })

    it('renders docs detail route with nested params inside docs layout', async () => {
        renderAt('/docs/guide')

        expect(await screen.findByTestId('app-layout')).toBeInTheDocument()
        expect(await screen.findByTestId('docs-layout')).toBeInTheDocument()
        expect(await screen.findByText('Doc detail')).toBeInTheDocument()
    })

    it('renders admin route inside layout and marks it as admin-only', async () => {
        renderAt('/admin')

        expect(await screen.findByTestId('app-layout')).toBeInTheDocument()
        expect(await screen.findByText('Admin page')).toBeInTheDocument()

        expect(requireAuthMock).toHaveBeenCalledWith(
            expect.objectContaining({ requireAdmin: false })
        )
        expect(requireAuthMock).toHaveBeenCalledWith(
            expect.objectContaining({ requireAdmin: true })
        )
        expect(requireGuestMock).not.toHaveBeenCalled()
    })

    it.each([
        ['/request-access', 'Request access page'],
        ['/register', 'Register page'],
        ['/forgot-password', 'Forgot password page'],
        ['/reset-password', 'Reset password page'],
        ['/login', 'Login page'],
    ])('renders guest route %s without layout', async (path, pageText) => {
        renderAt(path)

        expect(await screen.findByText(pageText)).toBeInTheDocument()
        expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
        expect(requireAuthMock).not.toHaveBeenCalled()
        expect(requireGuestMock).toHaveBeenCalled()
    })

    it('redirects unknown paths to login', async () => {
        renderAt('/nope')

        expect(await screen.findByText('Login page')).toBeInTheDocument()
        expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    })
})
