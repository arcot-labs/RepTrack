import { AuthService } from '@/api/generated'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import { ResetPassword } from '@/pages/ResetPassword'
import { createDeferred, getMockCallArg } from '@/tests/utils'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const resetPasswordMock = vi.spyOn(AuthService, 'resetPassword')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')
const notifyErrorMock = vi.spyOn(notify, 'error')
const preprocessTrim = vi.hoisted(() => vi.fn())

vi.mock('@/lib/validation', async () => {
    const { z } = await import('zod')
    return {
        preprocessTrim: (schema: unknown) =>
            z.preprocess((value) => {
                preprocessTrim(value)
                return value
            }, schema as never),
    }
})

const renderPage = (initialEntry = '/reset-password') => {
    const router = createMemoryRouter(
        [
            { path: '/reset-password', element: <ResetPassword /> },
            { path: '/login', element: <div>login page</div> },
        ],
        { initialEntries: [initialEntry] }
    )
    return {
        router,
        ...render(<RouterProvider router={router} />),
    }
}

describe('ResetPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetPasswordMock.mockResolvedValue({ error: undefined } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
        notifyErrorMock.mockImplementation(() => undefined)
    })

    it('renders form fields and login link', () => {
        renderPage()

        expect(screen.getByText('Reset Password')).toBeInTheDocument()
        expect(screen.getByLabelText('Token')).toBeInTheDocument()
        expect(screen.getByLabelText('New Password')).toBeInTheDocument()
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Reset password' })
        ).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute(
            'href',
            '/login'
        )
    })

    it('prefills and disables token input when token is provided in URL', () => {
        renderPage('/reset-password?token=abc123')

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toBeDisabled()
        expect(tokenInput).toHaveValue('abc123')
    })

    it('prevents submission when fields are invalid', async () => {
        renderPage()

        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        await waitFor(() => {
            expect(resetPasswordMock).not.toHaveBeenCalled()
        })

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toHaveAttribute('aria-invalid', 'true')
        expect(tokenInput).toHaveClass('border-destructive')

        const passwordInput = screen.getByLabelText('New Password')
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
        expect(passwordInput).toHaveClass('border-destructive')

        const confirmInput = screen.getByLabelText('Confirm Password')
        expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
        expect(confirmInput).toHaveClass('border-destructive')
    })

    it('prevents submission when passwords do not match', async () => {
        renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(
            screen.getByLabelText('New Password'),
            'password123'
        )
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password456'
        )
        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        await waitFor(() => {
            expect(resetPasswordMock).not.toHaveBeenCalled()
        })

        const confirmInput = screen.getByLabelText('Confirm Password')
        expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
        expect(confirmInput).toHaveClass('border-destructive')
    })

    it('submits reset password request and navigates to login on success', async () => {
        const { router } = renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(
            screen.getByLabelText('New Password'),
            'password123'
        )
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        await waitFor(() => {
            expect(resetPasswordMock).toHaveBeenCalledOnce()
        })

        expect(resetPasswordMock).toHaveBeenCalledWith({
            body: { token: 'abc123', password: 'password123' },
        })
        expect(preprocessTrim).toHaveBeenCalledWith('abc123')

        expect(notifySuccessMock).toHaveBeenCalledWith(
            'Password reset. You can now log in'
        )

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(screen.getByText('login page')).toBeInTheDocument()
    })

    it('routes API errors through handleApiError', async () => {
        const error = { code: 'SOME_ERROR', detail: 'boom' }
        resetPasswordMock.mockResolvedValue({ error } as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(
            screen.getByLabelText('New Password'),
            'password123'
        )
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        await waitFor(() => {
            expect(handleApiErrorMock).toHaveBeenCalledOnce()
        })

        const options = getMockCallArg(handleApiErrorMock, 0, 1) as {
            fallbackMessage?: string
            httpErrorHandlers?: Record<string, unknown>
        }

        expect(handleApiErrorMock).toHaveBeenCalledWith(
            error,
            expect.anything()
        )
        expect(options.fallbackMessage).toBe('Failed to reset password')
        expect(options.httpErrorHandlers?.invalid_token).toEqual(
            expect.any(Function)
        )
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('handles invalid_token error', async () => {
        const error = { code: 'invalid_token', detail: 'Invalid token' }
        resetPasswordMock.mockResolvedValue({ error } as never)

        handleApiErrorMock.mockImplementation(async (err, options) => {
            await options.httpErrorHandlers?.[error.code]?.(err as never)
        })

        const { router } = renderPage('/reset-password?token=abc123')

        expect(screen.getByLabelText('Token')).toBeDisabled()

        await userEvent.type(
            screen.getByLabelText('New Password'),
            'password123'
        )
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        await waitFor(() => {
            expect(notifyErrorMock).toHaveBeenCalledWith('Invalid token')
        })

        await waitFor(() => {
            expect(router.state.location.search).toBe('')
        })

        const tokenInput = screen.getByLabelText('Token')
        expect(tokenInput).toBeEnabled()
        expect(tokenInput).toHaveValue('')
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('disables submit button while request is pending', async () => {
        const pending = createDeferred<{ error?: unknown }>()
        resetPasswordMock.mockReturnValue(pending.promise as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('Token'), 'abc123')
        await userEvent.type(
            screen.getByLabelText('New Password'),
            'password123'
        )
        await userEvent.type(
            screen.getByLabelText('Confirm Password'),
            'password123'
        )
        await userEvent.click(
            screen.getByRole('button', { name: 'Reset password' })
        )

        expect(
            screen.getByRole('button', { name: 'Resetting...' })
        ).toBeDisabled()

        pending.resolve({ error: undefined })

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Reset password' })
            ).toBeEnabled()
        })
    })
})
