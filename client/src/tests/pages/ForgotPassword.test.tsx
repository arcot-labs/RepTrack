import { AuthService } from '@/api/generated'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const forgotPasswordMock = vi.spyOn(AuthService, 'forgotPassword')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')
const preprocessTrimAndLowerMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/validation', async () => {
    const { z } = await import('zod')
    return {
        preprocessTrimAndLower: (schema: unknown) =>
            z.preprocess((value) => {
                preprocessTrimAndLowerMock(value)
                return value
            }, schema as never),
    }
})

const createDeferred = <T,>() => {
    let resolvePromise!: (value: T) => void
    const promise = new Promise<T>((resolve) => {
        resolvePromise = resolve
    })
    return { promise, resolve: resolvePromise }
}

const renderPage = () =>
    render(
        <MemoryRouter>
            <ForgotPassword />
        </MemoryRouter>
    )

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        forgotPasswordMock.mockResolvedValue({ error: undefined } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
    })

    it('renders form and navigation links', () => {
        renderPage()

        expect(screen.getByText('Forgot Password')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Send Reset Link' })
        ).toBeInTheDocument()

        expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute(
            'href',
            '/login'
        )
        expect(
            screen.getByRole('link', { name: 'Request Access' })
        ).toHaveAttribute('href', '/request-access')
    })

    it('prevents submission when email is invalid', async () => {
        renderPage()

        const emailInput = screen.getByLabelText('Email')
        await userEvent.click(
            screen.getByRole('button', { name: 'Send Reset Link' })
        )

        await waitFor(() => {
            expect(forgotPasswordMock).not.toHaveBeenCalled()
        })

        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveClass('border-destructive')
    })

    it('submits email and resets on success', async () => {
        renderPage()

        const emailInput = screen.getByLabelText('Email')
        await userEvent.type(emailInput, 'test@example.com')

        await userEvent.click(
            screen.getByRole('button', { name: 'Send Reset Link' })
        )

        await waitFor(() => {
            expect(forgotPasswordMock).toHaveBeenCalledOnce()
        })

        expect(forgotPasswordMock).toHaveBeenCalledWith({
            body: { email: 'test@example.com' },
        })
        expect(preprocessTrimAndLowerMock).toHaveBeenCalledWith(
            'test@example.com'
        )

        expect(notifySuccessMock).toHaveBeenCalledOnce()
        expect(notifySuccessMock).toHaveBeenCalledWith(
            'If that email is registered, a reset link has been sent'
        )

        expect(emailInput).toHaveValue('')
    })

    it('routes errors through handleApiError', async () => {
        const error = { code: 'SOME_ERROR', detail: 'boom' }
        forgotPasswordMock.mockResolvedValue({ error } as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
        await userEvent.click(
            screen.getByRole('button', { name: 'Send Reset Link' })
        )

        await waitFor(() => {
            expect(handleApiErrorMock).toHaveBeenCalledOnce()
        })

        expect(handleApiErrorMock).toHaveBeenCalledWith(error, {
            fallbackMessage: 'Failed to request password reset',
        })
        expect(notifySuccessMock).not.toHaveBeenCalled()
    })

    it('disables submit button while request is pending', async () => {
        const pending = createDeferred<{ error?: unknown }>()
        forgotPasswordMock.mockReturnValue(pending.promise as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
        await userEvent.click(
            screen.getByRole('button', { name: 'Send Reset Link' })
        )

        expect(
            screen.getByRole('button', { name: 'Sending...' })
        ).toBeDisabled()

        pending.resolve({ error: undefined })

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Send Reset Link' })
            ).toBeEnabled()
        })
    })
})
