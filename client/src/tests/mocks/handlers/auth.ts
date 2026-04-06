import {
    type LoginData,
    type LogoutData,
    type RefreshTokenData,
} from '@/api/generated'
import { client } from '@/api/generated/client.gen'
import { http, HttpResponse } from 'msw'

export const refreshTokenUrl = client.buildUrl<RefreshTokenData>({
    url: '/api/auth/refresh-token',
})

export const loginUrl = client.buildUrl<LoginData>({
    body: { username: '_', password: '_' },
    url: '/api/auth/login',
})

const logoutUrl = client.buildUrl<LogoutData>({
    url: '/api/auth/logout',
})

export const handlers = [
    http.post(refreshTokenUrl, () => {
        return new HttpResponse(null, { status: 204 })
    }),

    http.post(loginUrl, () => {
        return new HttpResponse(null, { status: 204 })
    }),

    http.post(logoutUrl, () => {
        return new HttpResponse(null, { status: 204 })
    }),
]
