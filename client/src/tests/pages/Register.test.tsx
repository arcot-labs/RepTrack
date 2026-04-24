import type { ErrorResponse } from '@/api/generated'
import { AuthService } from '@/api/generated'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import { Register } from '@/pages/Register'
import { createDeferred } from '@/tests/utils'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const registerMock = vi.spyOn(AuthService, 'register')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')
const notifyErrorMock = vi.spyOn(notify, 'error')
const notifyInfoMock = vi.spyOn(notify, 'info')
const preprocessTrimMock = vi.hoisted(() => vi.fn())
const preprocessTrimAndLowerMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/validation', async () => {
    const actual =
        await vi.importActual<typeof import('@/lib/validation')>(
            '@/lib/validation'
        )
    const { z } = await import('zod')
    return {
        ...actual,
        preprocessTrim: (schema: unknown) =>
            z.preprocess((value) => {
                preprocessTrimMock(value)
                return value
            }, schema as never),
        preprocessTrimAndLower: (schema: unknown) =>
            z.preprocess((value) => {
                preprocessTrimAndLowerMock(value)
                return value
            }, schema as never),
    }
})

const renderPage = (initialEntry = '/register') => {
    const router = createMemoryRouter(
        [
            { path: '/register', element: <Register /> },
            { path: '/login', element: <div>login page</div> },
            {
                path: '/request-access',
                element: <div>request access page</div>,
            },
        ],
        { initialEntries: [initialEntry] }
    )

    return {
        router,
        ...render(<RouterProvider router={router} />),
    }
}

describe('Register', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        registerMock.mockResolvedValue({ error: undefined } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
        notifyErrorMock.mockImplementation(() => undefined)
        notifyInfoMock.mockImplementation(() => undefined)
    })

    it('renders form fields and navigation links', () => {
        renderPage()

        expect(screen.getAllByText('Register')).toHaveLength(2)
        expect(screen.getByLabelText('Token')).toBeInTheDocument()
        expect(screen.getByLabelText('Username')).toBeInTheDocument()
        expect(screen.getByLabelText('Password')).toBeInTheDocument()
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Register' })
        ).toBeInTheDocument()

        expect(
            screen.getByRole('link', { name: 'Request Access' })
        ).toHaveAttribute('href', '/request-access')
        expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute(
            'href',
            '/login'
        )
    })

    it('prefills and disables token input when token is provided in URL', () => {
        renderPage('/register?token=abc123')

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toBeDisabled()
        expect(tokenInput).toHaveValue('abc123')
    })

    it('prevents submission when fields are invalid', async () => {
        renderPage()

        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        await waitFor(() => {
            expect(registerMock).not.toHaveBeenCalled()
        })

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toHaveAttribute('aria-invalid', 'true')
        expect(tokenInput).toHaveClass('border-destructive')

        const usernameInput = screen.getByLabelText('Username')
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
        expect(usernameInput).toHaveClass('border-destructive')

        const passwordInput = screen.getByLabelText('Password')
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
        expect(passwordInput).toHaveClass('border-destructive')

        const confirmInput = screen.getByLabelText('Confirm Password')
        expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
        expect(confirmInput).toHaveClass('border-destructive')
    })

    it('prevents submission when username is email address', async () => {
        renderPage()

        const usernameInput = screen.getByLabelText('Username')

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(usernameInput, 'test@example.com')
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        await waitFor(() => {
            expect(registerMock).not.toHaveBeenCalled()
        })

        expect(usernameInput).toHaveAttribute('aria-invalid', 'true')
        expect(usernameInput).toHaveClass('border-destructive')
    })

    it('submits register request and navigates to login on success', async () => {
        const { router } = renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(screen.getByLabelText('Username'), 'someuser')
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        await waitFor(() => {
            expect(registerMock).toHaveBeenCalledOnce()
        })

        const call = registerMock.mock.calls[0]?.[0] as { body: unknown }
        expect(call.body).toEqual({
            token: 'abc123',
            username: 'someuser',
            password: 'password123',
        })
        expect(preprocessTrimMock).toHaveBeenCalledWith('abc123')
        expect(preprocessTrimAndLowerMock).toHaveBeenCalledWith('someuser')

        expect(notifySuccessMock).toHaveBeenCalledWith(
            'Registered successfully. You can now log in'
        )

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(screen.getByText('login page')).toBeInTheDocument()
    })

    it('handles invalid_token error', async () => {
        const error: ErrorResponse = {
            code: 'invalid_token',
            detail: 'Invalid token',
        }
        registerMock.mockResolvedValue({ error } as never)

        handleApiErrorMock.mockImplementation(async (err, options) => {
            await options.httpErrorHandlers?.[error.code]?.(err as never)
        })

        const { router } = renderPage('/register?token=abc123')

        expect(screen.getByLabelText('Token')).toBeDisabled()

        await userEvent.type(screen.getByLabelText('Username'), 'someuser')
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        await waitFor(() => {
            expect(notifyErrorMock).toHaveBeenCalledWith('Invalid token')
        })
        expect(notifyInfoMock).toHaveBeenCalledWith(
            'If token is expired, request access again'
        )

        await waitFor(() => {
            expect(router.state.location.search).toBe('')
        })

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toBeEnabled()
        expect(tokenInput).toHaveValue('')
        expect(screen.getByLabelText('Confirm Password')).toHaveValue('')
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('handles username_taken error', async () => {
        const error: ErrorResponse = {
            code: 'username_taken',
            detail: 'Username taken',
        }
        registerMock.mockResolvedValue({ error } as never)

        handleApiErrorMock.mockImplementation(async (err, options) => {
            await options.httpErrorHandlers?.[error.code]?.(err as never)
        })

        renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(screen.getByLabelText('Username'), 'someuser')
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        await waitFor(() => {
            expect(notifyErrorMock).toHaveBeenCalledWith('Username taken')
        })

        expect(screen.getByLabelText('Username')).toHaveValue('')
        expect(screen.getByLabelText('Confirm Password')).toHaveValue('')
        expect(screen.getByLabelText('Token')).toHaveValue('abc123')
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('disables submit button while request is pending', async () => {
        const pending = createDeferred<{ error?: unknown }>()
        registerMock.mockReturnValue(pending.promise as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(screen.getByLabelText('Username'), 'someuser')
        await userEvent.type(screen.getByLabelText('Password'), 'password123')
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(screen.getByRole('button', { name: 'Register' }))

        expect(
            screen.getByRole('button', { name: 'Registering...' })
        ).toBeDisabled()

        pending.resolve({ error: undefined })

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Register' })
            ).toBeEnabled()
        })
    })
})
