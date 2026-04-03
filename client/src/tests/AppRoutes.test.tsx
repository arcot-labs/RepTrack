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

    it('renders dashboard inside layout', () => {
        renderAt('/')

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByText('Dashboard page')).toBeInTheDocument()
        expect(requireAuthMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ requireAdmin: false })
        )
        expect(requireGuestMock).not.toHaveBeenCalled()
    })

    it('renders exercises inside layout', () => {
        renderAt('/exercises')

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByText('Exercises page')).toBeInTheDocument()
    })

    it('renders docs index route inside docs layout', () => {
        renderAt('/docs')

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('docs-layout')).toBeInTheDocument()
        expect(screen.getByText('Docs index')).toBeInTheDocument()
    })

    it('renders docs detail route with nested params inside docs layout', () => {
        renderAt('/docs/guide')

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByTestId('docs-layout')).toBeInTheDocument()
        expect(screen.getByText('Doc detail')).toBeInTheDocument()
    })

    it('renders admin route inside layout and marks it as admin-only', () => {
        renderAt('/admin')

        expect(screen.getByTestId('app-layout')).toBeInTheDocument()
        expect(screen.getByText('Admin page')).toBeInTheDocument()

        expect(requireAuthMock).toHaveBeenCalledTimes(2)
        expect(requireAuthMock).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ requireAdmin: false })
        )
        expect(requireAuthMock).toHaveBeenNthCalledWith(
            2,
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
    ])('renders guest route %s without layout', (path, pageText) => {
        renderAt(path)

        expect(screen.getByText(pageText)).toBeInTheDocument()
        expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
        expect(requireAuthMock).not.toHaveBeenCalled()
        expect(requireGuestMock).toHaveBeenCalledTimes(1)
    })

    it('redirects unknown paths to login', () => {
        renderAt('/nope')

        expect(screen.getByText('Login page')).toBeInTheDocument()
        expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
    })
})
