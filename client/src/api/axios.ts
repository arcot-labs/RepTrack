import {
    AuthService,
    type LoginData,
    type RefreshTokenData,
} from '@/api/generated'
import { client } from '@/api/generated/client.gen'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'
import axios, { AxiosError } from 'axios'

// created for type safety
const refreshUrl = client.buildUrl<RefreshTokenData>({
    url: '/api/auth/refresh-token',
})
const loginUrl = client.buildUrl<LoginData>({
    body: { username: '_', password: '_' },
    url: '/api/auth/login',
})

export function configureApiClient() {
    const axiosInstance = axios.create({
        baseURL: env.API_URL,
        withCredentials: true,
    })

    let isRefreshing = false
    let failedQueue: {
        resolve: (value?: unknown) => void
        reject: (error: unknown) => void
    }[] = []

    const processQueue = (error: unknown, tokenUpdated = false) => {
        failedQueue.forEach(({ resolve, reject }) => {
            if (error) reject(error)
            else resolve(tokenUpdated)
        })
        failedQueue = []
    }

    axiosInstance.interceptors.response.use(
        (res) => {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
            logger.debug(`API response: ${res.request?.responseURL}`, res)
            return res
        },
        async (error: AxiosError) => {
            const originalRequest = error.config
            if (!originalRequest) return Promise.reject(error)

            logger.debug(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `API error response: ${originalRequest.url}`,
                error.response
            )

            if (
                error.response?.status === 401 &&
                !originalRequest._retry &&
                !originalRequest.url?.endsWith(refreshUrl) &&
                !originalRequest.url?.endsWith(loginUrl)
            ) {
                if (isRefreshing) {
                    // queue requests
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject })
                    }).then(() => axiosInstance(originalRequest))
                }

                originalRequest._retry = true
                isRefreshing = true

                try {
                    const { error } = await AuthService.refreshToken()
                    if (!error) {
                        logger.info('Success refreshing token')
                        processQueue(null, true)
                        return await axiosInstance(originalRequest)
                    }
                    const refreshError = new Error('Failed to refresh token', {
                        cause: error,
                    })
                    processQueue(refreshError, false)
                    throw refreshError
                } finally {
                    isRefreshing = false
                }
            }

            return Promise.reject(error)
        }
    )

    client.setConfig({
        axios: axiosInstance,
    })
}
