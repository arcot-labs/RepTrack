import type { SessionContextType } from '@/models/session'
import { Dashboard } from '@/pages/Dashboard'
import { render, screen } from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

let refreshMock: MockedFunction<() => Promise<void>>
const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()

vi.mock('@/auth/useSession', () => ({
    useSession: () => useSessionMock(),
}))

const makeSession = (
    overrides: Partial<SessionContextType> = {}
): SessionContextType => ({
    user: null,
    isLoading: false,
    isAuthenticated: true,
    refresh: refreshMock,
    ...overrides,
})

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        refreshMock = vi.fn().mockResolvedValue(undefined)
        useSessionMock.mockReturnValue(makeSession())
    })

    it('renders title and greeting', () => {
        useSessionMock.mockReturnValue(
            makeSession({ user: { first_name: 'Test' } as never })
        )

        render(<Dashboard />)

        expect(
            screen.getByRole('heading', { level: 1, name: 'Dashboard' })
        ).toBeInTheDocument()
        expect(screen.getByText('Welcome, Test!')).toBeInTheDocument()
    })

    it('renders greeting when user missing', () => {
        render(<Dashboard />)

        expect(screen.getByText('Welcome!')).toBeInTheDocument()
    })
})
