import { AuthService } from '@/api/generated'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import type { SessionContextType } from '@/models/session'
import { Login } from '@/pages/Login'
import { createDeferred, getMockCallArg } from '@/tests/utils'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

const loginMock = vi.spyOn(AuthService, 'login')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')
let refreshMock: MockedFunction<() => Promise<void>>
const useSessionMock: MockedFunction<() => SessionContextType> = vi.fn()
const preprocessTrimAndLowerMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth/useSession', () => ({
    useSession: () => useSessionMock(),
}))

vi.mock('@/lib/validation', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/validation')>(
            '@/lib/validation'
        )
    const { z } = await import('zod')
    return {
        ...actual,
        preprocessTrimAndLower: (schema: unknown) =>
            z.preprocess((value) => {
                preprocessTrimAndLowerMock(value)
                return value
            }, schema as never),
    }
})

const renderPage = (initialEntry = '/login') => {
    const router = createMemoryRouter(
        [
            { path: '/login', element: <Login /> },
            {
                path: '/forgot-password',
                element: <div>forgot password page</div>,
            },
            {
                path: '/request-access',
                element: <div>request access page</div>,
            },
            { path: '/register', element: <div>register page</div> },
            { path: '/secret', element: <div>secret page</div> },
        ],
        { initialEntries: [initialEntry] }
    )
    return {
        router,
        ...render(<RouterProvider router={router} />),
    }
}

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        refreshMock = vi.fn().mockResolvedValue(undefined)
        useSessionMock.mockReturnValue({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            refresh: refreshMock,
        })
        loginMock.mockResolvedValue({ error: undefined } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
    })

    it('renders form and navigation links', () => {
        renderPage()

        expect(screen.getAllByText('Login')).toHaveLength(2)
        expect(screen.getByLabelText('Username or Email')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Login' })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', { name: 'Forgot password?' })
        ).toHaveAttribute('href', '/forgot-password')
        expect(
            screen.getByRole('link', { name: 'Request Access' })
        ).toHaveAttribute('href', '/request-access')
        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register'
        )
    })

    it('prevents submission when fields are invalid', async () => {
        renderPage()

        await userEvent.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(loginMock).not.toHaveBeenCalled()
        })

        const identifierInput = screen.getByLabelText('Username or Email')
        expect(identifierInput).toHaveAttribute('aria-invalid', 'true')
        expect(identifierInput).toHaveClass('border-destructive')

        const passwordInput = screen.getByLabelText('Password')
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
        expect(passwordInput).toHaveClass('border-destructive')
    })

    it('submits username login and navigates to from state on success', async () => {
        const { router } = renderPage({
            pathname: '/login',
            state: { from: { pathname: '/secret' } },
        } as never)

        await userEvent.type(
            screen.getByLabelText('Username or Email'),
            'someuser'
        )
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledOnce()
        })

        const usernameCall = getMockCallArg(loginMock) as { body: unknown }
        expect(usernameCall.body).toEqual(
            expect.objectContaining({
                username: 'someuser',
                password: 'password123',
            })
        )
        expect(preprocessTrimAndLowerMock).toHaveBeenCalledWith('someuser')

        await waitFor(() => {
            expect(refreshMock).toHaveBeenCalledOnce()
        })
        expect(notifySuccessMock).toHaveBeenCalledWith('Logged in')

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/secret')
        })
        expect(screen.getByText('secret page')).toBeInTheDocument()
    })

    it('submits email login on success', async () => {
        renderPage()

        await userEvent.type(
            screen.getByLabelText('Username or Email'),
            'test@example.com'
        )
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledOnce()
        })

        const emailCall = getMockCallArg(loginMock) as { body: unknown }
        expect(emailCall.body).toEqual(
            expect.objectContaining({
                email: 'test@example.com',
                password: 'password123',
            })
        )
        expect(preprocessTrimAndLowerMock).toHaveBeenCalledWith(
            'test@example.com'
        )

        await waitFor(() => {
            expect(refreshMock).toHaveBeenCalledOnce()
        })
        expect(notifySuccessMock).toHaveBeenCalledWith('Logged in')
    })

    it('routes errors through handleApiError and clears password', async () => {
        const error = { code: 'SOME_ERROR', detail: 'boom' }
        loginMock.mockResolvedValue({ error } as never)

        renderPage()

        await userEvent.type(
            screen.getByLabelText('Username or Email'),
            'someuser'
        )
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(handleApiErrorMock).toHaveBeenCalledOnce()
        })

        expect(handleApiErrorMock).toHaveBeenCalledWith(error, {
            fallbackMessage: 'Failed to log in',
        })

        expect(screen.getByLabelText('Password')).toHaveValue('')
        expect(refreshMock).not.toHaveBeenCalled()
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('disables submit button while request is pending', async () => {
        const pending = createDeferred<{ error?: unknown }>()
        loginMock.mockReturnValue(pending.promise as never)

        renderPage()

        await userEvent.type(
            screen.getByLabelText('Username or Email'),
            'someuser'
        )
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.click(screen.getByRole('button', { name: 'Login' }))

        expect(
            screen.getByRole('button', { name: 'Logging in...' })
        ).toBeDisabled()

        pending.resolve({ error: { code: 'SOME_ERROR', detail: 'boom' } })

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Login' })).toBeEnabled()
        })
    })
})
