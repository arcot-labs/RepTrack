import { AuthService } from '@/api/generated'
import { HeaderActions } from '@/components/HeaderActions'
import { notify } from '@/lib/notify'
import type { SessionContextType } from '@/models/session'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

const navigateMock = vi.fn()
let refreshMock: MockedFunction<() => Promise<void>>
const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()
const authServiceMock = vi.mocked(AuthService)
const notifySuccessMock = vi.spyOn(notify, 'success')
const notifyErrorMock = vi.spyOn(notify, 'error')

vi.mock('@/api/generated', () => ({
    AuthService: {
        logout: vi.fn().mockResolvedValue({}),
    },
}))

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}))
vi.mock('@/auth/useSession', () => ({
    useSession: () => useSessionMock(),
}))
vi.mock('@/components/ThemeToggle', () => ({
    ThemeToggle: () => <div data-testid="mock-theme-toggle" />,
}))
vi.mock('@/components/feedback/FeedbackFormDialog', () => ({
    FeedbackFormDialog: ({ trigger }: { trigger: ReactElement }) => (
        <div data-testid="mock-feedback-dialog">{trigger}</div>
    ),
}))

const makeSession = (
    refresh: MockedFunction<() => Promise<void>>,
    overrides: Partial<SessionContextType> = {}
): SessionContextType => ({
    user: null,
    isLoading: false,
    isAuthenticated: true,
    refresh,
    ...overrides,
})

const getLogoutButtons = () =>
    screen.getAllByRole('button', { name: /logout/i })

describe('HeaderActions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        refreshMock = vi.fn().mockResolvedValue(undefined)
        useSessionMock.mockReturnValue(makeSession(refreshMock))
        notifySuccessMock.mockImplementation(() => undefined)
        notifyErrorMock.mockImplementation(() => undefined)
        vi.mocked(authServiceMock.logout).mockResolvedValue({
            error: undefined,
        } as never)
    })

    it('renders all buttons', () => {
        render(<HeaderActions />)

        expect(screen.getAllByTestId('mock-theme-toggle')).toHaveLength(2)
        expect(screen.getAllByTestId('mock-feedback-dialog')).toHaveLength(2)
        expect(getLogoutButtons()).toHaveLength(2)
    })

    it('has accessible labels for icon buttons', () => {
        render(<HeaderActions />)

        expect(screen.getByLabelText('Logout')).toBeInTheDocument()
        expect(screen.getByLabelText('Feedback')).toBeInTheDocument()
    })

    it('refreshes session and redirects after successful logout', async () => {
        render(<HeaderActions />)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await userEvent.click(getLogoutButtons()[0]!)

        await waitFor(() => {
            expect(notifySuccessMock).toHaveBeenCalledWith('Logged out')
        })

        expect(notifyErrorMock).not.toHaveBeenCalled()
        expect(authServiceMock.logout).toHaveBeenCalledOnce()
        expect(refreshMock).toHaveBeenCalledOnce()
        expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
    })

    it('shows error notification when logout fails', async () => {
        vi.mocked(authServiceMock.logout).mockResolvedValue({
            error: 'something went wrong',
        } as never)

        render(<HeaderActions />)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await userEvent.click(getLogoutButtons()[1]!)

        await waitFor(() => {
            expect(notifyErrorMock).toHaveBeenCalledWith('Failed to log out')
        })

        expect(notifySuccessMock).not.toHaveBeenCalled()
        expect(authServiceMock.logout).toHaveBeenCalledOnce()
        expect(refreshMock).not.toHaveBeenCalled()
        expect(navigateMock).not.toHaveBeenCalled()
    })
})
