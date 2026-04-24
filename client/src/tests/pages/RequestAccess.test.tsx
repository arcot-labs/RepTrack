import type { ErrorResponse } from '@/api/generated'
import { AuthService } from '@/api/generated'
import * as httpModule from '@/lib/http'
import { notify } from '@/lib/notify'
import { RequestAccess } from '@/pages/RequestAccess'
import { createDeferred } from '@/tests/utils'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestAccessMock = vi.spyOn(AuthService, 'requestAccess')
const handleApiErrorMock = vi.spyOn(httpModule, 'handleApiError')
const notifySuccessMock = vi.spyOn(notify, 'success')
const notifyErrorMock = vi.spyOn(notify, 'error')
const preprocessTrimMock = vi.hoisted(() => vi.fn())
const preprocessTrimAndLowerMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/validation', async () => {
    const { z } = await import('zod')
    return {
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

const renderPage = (initialEntry = '/request-access') => {
    const router = createMemoryRouter(
        [
            { path: '/request-access', element: <RequestAccess /> },
            { path: '/login', element: <div>login page</div> },
            { path: '/register', element: <div>register page</div> },
        ],
        { initialEntries: [initialEntry] }
    )

    return {
        router,
        ...render(<RouterProvider router={router} />),
    }
}

describe('RequestAccess', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        requestAccessMock.mockResolvedValue({
            data: 'ok',
            error: undefined,
        } as never)
        handleApiErrorMock.mockResolvedValue(undefined)
        notifySuccessMock.mockImplementation(() => undefined)
        notifyErrorMock.mockImplementation(() => undefined)
    })

    it('renders form fields and navigation links', () => {
        renderPage()

        expect(screen.getAllByText('Request Access')).toHaveLength(2)
        expect(screen.getByLabelText('First name')).toBeInTheDocument()
        expect(screen.getByLabelText('Last name')).toBeInTheDocument()
        expect(screen.getByLabelText('Email')).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Request Access' })
        ).toBeInTheDocument()

        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register'
        )
        expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute(
            'href',
            '/login'
        )
    })

    it('prevents submission when fields are invalid', async () => {
        renderPage()

        await userEvent.click(
            screen.getByRole('button', { name: 'Request Access' })
        )

        await waitFor(() => {
            expect(requestAccessMock).not.toHaveBeenCalled()
        })

        const firstNameInput = screen.getByLabelText('First name')
        expect(firstNameInput).toHaveAttribute('aria-invalid', 'true')
        expect(firstNameInput).toHaveClass('border-destructive')

        const lastNameInput = screen.getByLabelText('Last name')
        expect(lastNameInput).toHaveAttribute('aria-invalid', 'true')
        expect(lastNameInput).toHaveClass('border-destructive')

        const emailInput = screen.getByLabelText('Email')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
        expect(emailInput).toHaveClass('border-destructive')
    })

    it('submits request and resets on success', async () => {
        renderPage()

        const firstNameInput = screen.getByLabelText('First name')
        const lastNameInput = screen.getByLabelText('Last name')
        const emailInput = screen.getByLabelText('Email')

        await userEvent.type(firstNameInput, '  First  ')
        await userEvent.type(lastNameInput, ' Last ')
        await userEvent.type(emailInput, 'TEST@Example.com')

        await userEvent.click(
            screen.getByRole('button', { name: 'Request Access' })
        )

        await waitFor(() => {
            expect(requestAccessMock).toHaveBeenCalledOnce()
        })

        expect(requestAccessMock).toHaveBeenCalledWith({
            body: {
                email: 'TEST@Example.com',
                first_name: '  First  ',
                last_name: ' Last ',
            },
        })
        expect(preprocessTrimAndLowerMock).toHaveBeenCalledWith(
            'TEST@Example.com'
        )
        expect(preprocessTrimMock).toHaveBeenCalledWith('  First  ')
        expect(preprocessTrimMock).toHaveBeenCalledWith(' Last ')

        expect(notifySuccessMock).toHaveBeenCalledWith('ok')
        expect(emailInput).toHaveValue('')
        expect(firstNameInput).toHaveValue('')
        expect(lastNameInput).toHaveValue('')
    })

    it('handles email_in_use error', async () => {
        const error: ErrorResponse = {
            code: 'email_in_use',
            detail: 'Email is already in use',
        }
        requestAccessMock.mockResolvedValue({ data: undefined, error } as never)

        handleApiErrorMock.mockImplementation(async (err, options) => {
            await options.httpErrorHandlers?.[error.code]?.(err as never)
        })

        const { router } = renderPage()

        await userEvent.type(screen.getByLabelText('First name'), 'First')
        await userEvent.type(screen.getByLabelText('Last name'), 'Last')
        await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
        await userEvent.click(
            screen.getByRole('button', { name: 'Request Access' })
        )

        await waitFor(() => {
            expect(notifyErrorMock).toHaveBeenCalledWith(
                'Email is already in use'
            )
        })

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/login')
        })
        expect(screen.getByText('login page')).toBeInTheDocument()
    })

    it.each(['access_request_pending', 'access_request_rejected'] as const)(
        'handles %s error',
        async (errorCode) => {
            const error: ErrorResponse = {
                code: errorCode,
                detail: `Error: ${errorCode}`,
            }
            requestAccessMock.mockResolvedValue({
                data: undefined,
                error,
            } as never)

            handleApiErrorMock.mockImplementation(async (err, options) => {
                await options.httpErrorHandlers?.[error.code]?.(err as never)
            })

            renderPage()

            const firstNameInput = screen.getByLabelText('First name')
            const lastNameInput = screen.getByLabelText('Last name')
            const emailInput = screen.getByLabelText('Email')

            await userEvent.type(firstNameInput, 'First')
            await userEvent.type(lastNameInput, 'Last')
            await userEvent.type(emailInput, 'test@example.com')
            await userEvent.click(
                screen.getByRole('button', { name: 'Request Access' })
            )
            await waitFor(() => {
                expect(notifyErrorMock).toHaveBeenCalledWith(
                    `Error: ${errorCode}`
                )
            })

            expect(firstNameInput).toHaveValue('')
            expect(lastNameInput).toHaveValue('')
            expect(emailInput).toHaveValue('')
        }
    )

    it('disables submit button while request is pending', async () => {
        const pending = createDeferred<{ data?: string; error?: unknown }>()
        requestAccessMock.mockReturnValue(pending.promise as never)

        renderPage()

        await userEvent.type(screen.getByLabelText('First name'), 'First')
        await userEvent.type(screen.getByLabelText('Last name'), 'Last')
        await userEvent.type(screen.getByLabelText('Email'), 'test@example.com')
        await userEvent.click(
            screen.getByRole('button', { name: 'Request Access' })
        )

        expect(
            screen.getByRole('button', { name: 'Submitting...' })
        ).toBeDisabled()

        pending.resolve({ data: 'ok', error: undefined })

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Request Access' })
            ).toBeEnabled()
        })
    })
})
