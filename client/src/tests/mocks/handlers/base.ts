import { http, HttpResponse } from 'msw'

export const successUrl = '/api/success'
export const errorUrl = '/api/error'
export const protectedUrl = '/api/protected'

export const handlers = [
    http.get(successUrl, () => {
        return HttpResponse.json('ok')
    }),

    http.get(errorUrl, () => {
        return new HttpResponse(null, { status: 500 })
    }),

    http.get(protectedUrl, () => {
        return HttpResponse.json('ok')
    }),
]
