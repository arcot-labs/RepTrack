import type { ErrorResponse, HttpValidationError } from '@/api/generated'
import { _internal, handleApiError } from '@/lib/http'
import { notify } from '@/lib/notify'
import type { ApiErrorOptions } from '@/models/error'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockInstance,
} from 'vitest'

const { isHttpError, isHttpValidationError } = _internal

describe('isHttpError', () => {
    it('identifies valid HttpError object', () => {
        const error: ErrorResponse = {
            code: 'ERROR_CODE',
            detail: 'An error occurred',
        }
        expect(isHttpError(error)).toBe(true)
    })

    it('rejects non-object values', () => {
        expect(isHttpError(null)).toBe(false)
        expect(isHttpError(undefined)).toBe(false)
        expect(isHttpError(42)).toBe(false)
        expect(isHttpError('error')).toBe(false)
    })

    it('rejects objects missing required properties', () => {
        expect(isHttpError({})).toBe(false)
        expect(isHttpError({ code: 'ERROR_CODE' })).toBe(false)
        expect(isHttpError({ detail: 'An error occurred' })).toBe(false)
    })

    it('rejects objects with wrong property types', () => {
        expect(isHttpError({ code: 123, detail: 'Error' })).toBe(false)
        expect(isHttpError({ code: 'ERROR_CODE', detail: 456 })).toBe(false)
    })
})

describe('isHttpValidationError', () => {
    it('identifies valid HttpValidationError object', () => {
        const error = {
            detail: [],
        }
        expect(isHttpValidationError(error)).toBe(true)
    })

    it('rejects non-object values', () => {
        expect(isHttpValidationError(null)).toBe(false)
        expect(isHttpValidationError(undefined)).toBe(false)
        expect(isHttpValidationError(42)).toBe(false)
        expect(isHttpValidationError('error')).toBe(false)
    })

    it('rejects objects missing detail property', () => {
        expect(isHttpValidationError({})).toBe(false)
    })

    it('rejects objects where detail is not array', () => {
        expect(isHttpValidationError({ detail: 'Invalid' })).toBe(false)
        expect(isHttpValidationError({ detail: { msg: 'Test' } })).toBe(false)
    })
})

describe('handleApiError', () => {
    let errorSpy: MockInstance<typeof notify.error>

    beforeEach(() => {
        errorSpy = vi.spyOn(notify, 'error').mockImplementation(() => {
            /* empty */
        })
    })

    afterEach(() => {
        errorSpy.mockRestore()
        vi.clearAllMocks()
    })

    it('runs handler when matching http error code handler exists', async () => {
        const handler = vi.fn(() => Promise.resolve())
        const error: ErrorResponse = { code: 'SOME_CODE', detail: 'boom' }
        const options: ApiErrorOptions = {
            fallbackMessage: 'fallback',
            httpErrorHandlers: {
                SOME_CODE: handler,
            },
        }

        await handleApiError(error, options)

        expect(handler).toHaveBeenCalledWith(error)
        expect(errorSpy).not.toHaveBeenCalled()
    })

    it('propagates handler errors for matching http error code', async () => {
        const handlerFailure = new Error('handler failed')
        const handler = vi.fn(() => Promise.reject(handlerFailure))
        const error: ErrorResponse = { code: 'SOME_CODE', detail: 'boom' }

        await expect(
            handleApiError(error, {
                fallbackMessage: 'fallback',
                httpErrorHandlers: {
                    SOME_CODE: handler,
                },
            })
        ).rejects.toThrow('handler failed')

        expect(errorSpy).not.toHaveBeenCalled()
    })

    it('shows error detail when no handler matches', async () => {
        const error: ErrorResponse = { code: 'OTHER', detail: 'failure' }
        const options: ApiErrorOptions = { fallbackMessage: 'fallback' }

        await handleApiError(error, options)

        expect(errorSpy).toHaveBeenCalledOnce()
        expect(errorSpy).toHaveBeenCalledWith('failure')
    })

    it('maps validation errors into notifications', async () => {
        const validationError: HttpValidationError = {
            detail: [
                { loc: [], msg: 'bad input', type: 'value_error' },
                { loc: [], msg: 'missing field', type: 'value_error.missing' },
            ],
        }
        const options: ApiErrorOptions = { fallbackMessage: 'fallback' }

        await handleApiError(validationError, options)

        expect(errorSpy).toHaveBeenCalledTimes(2)
        expect(errorSpy).toHaveBeenNthCalledWith(
            1,
            'Validation error: bad input'
        )
        expect(errorSpy).toHaveBeenNthCalledWith(
            2,
            'Validation error: missing field'
        )
    })

    it('does not notify for validation error with empty detail', async () => {
        const validationError: HttpValidationError = {
            detail: [],
        }

        await handleApiError(validationError, { fallbackMessage: 'fallback' })

        expect(errorSpy).not.toHaveBeenCalled()
    })

    it('renders fallback message for unknown errors', async () => {
        const unknownError = new Error('root cause')
        const options: ApiErrorOptions = { fallbackMessage: 'fallback' }

        await handleApiError(unknownError, options)

        expect(errorSpy).toHaveBeenCalledOnce()
        expect(errorSpy).toHaveBeenCalledWith('fallback')
    })
})
