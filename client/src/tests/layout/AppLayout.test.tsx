import { AppLayout } from '@/layout/AppLayout'
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

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
}))

const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))
vi.mock('@/auth/session', () => ({
    useSession: () => useSessionMock(),
}))
vi.mock('@/components/HeaderActions', () => ({
    HeaderActions: () => <div>header actions</div>,
}))

function renderLayout() {
    return render(
        <MemoryRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route index element={<div>page body</div>} />
                </Route>
            </Routes>
        </MemoryRouter>
    )
}

describe('AppLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useSessionMock.mockReturnValue({ user: null } as never)
    })

    it('renders navbar links and outlet content', () => {
        renderLayout()

        expect(screen.getByText('RepTrack')).toBeInTheDocument()
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Exercises')).toBeInTheDocument()
        expect(screen.getByText('header actions')).toBeInTheDocument()
        expect(screen.getByText('page body')).toBeInTheDocument()

        const homeLink = screen.getByRole('link', { name: 'RepTrack' })
        expect(homeLink).toHaveAttribute('href', '/')

        const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
        expect(dashboardLink).toHaveAttribute('href', '/')

        const exercisesLink = screen.getByRole('link', { name: 'Exercises' })
        expect(exercisesLink).toHaveAttribute('href', '/exercises')

        expect(
            screen.getByRole('button', { name: 'Open navigation' })
        ).toBeInTheDocument()
    })

    it('hides admin link for non-admin user', () => {
        useSessionMock.mockReturnValue({ user: { is_admin: false } } as never)

        renderLayout()

        expect(screen.queryByText('Admin')).toBeNull()
    })

    it('shows admin link for admin user', () => {
        useSessionMock.mockReturnValue({ user: { is_admin: true } } as never)

        renderLayout()

        expect(screen.getByText('Admin')).toBeInTheDocument()

        const adminLink = screen.getByRole('link', { name: 'Admin' })
        expect(adminLink).toHaveAttribute('href', '/admin')
    })
})
