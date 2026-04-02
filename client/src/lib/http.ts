import type { ErrorResponse, HttpValidationError } from '@/api/generated'
import { notify } from '@/lib/notify'
import type { ApiErrorOptions } from '@/models/error'

function isHttpError(error: unknown): error is ErrorResponse {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string' &&
        'detail' in error &&
        typeof error.detail === 'string'
    )
}

function isHttpValidationError(error: unknown): error is HttpValidationError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'detail' in error &&
        Array.isArray(error.detail)
    )
}

export async function handleApiError(
    error: unknown,
    options: ApiErrorOptions
): Promise<void> {
    if (isHttpError(error)) {
        const codeHandler = options.httpErrorHandlers?.[error.code]
        if (codeHandler) {
            await codeHandler(error)
            return
        }
        notify.error(error.detail)
        return
    }
    if (isHttpValidationError(error)) {
        error.detail?.forEach((detail) => {
            notify.error(`Validation error: ${detail.msg}`)
        })
        return
    }
    notify.error(options.fallbackMessage)
}

export const _internal = {
    isHttpError,
    isHttpValidationError,
}
