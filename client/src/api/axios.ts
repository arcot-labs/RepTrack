import {
    AuthService,
    type LoginData,
    type RefreshTokenData,
} from '@/api/generated'
import { client } from '@/api/generated/client.gen'
import { getEnv } from '@/config/env'
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
        baseURL: getEnv().API_URL,
        withCredentials: true,
    })

    let isRefreshing = false
    let failedQueue: {
        resolve: (value?: unknown) => void
        reject: (error: unknown) => void
    }[] = []

    const processQueue = (error: unknown) => {
        failedQueue.forEach(({ resolve, reject }) => {
            if (error) reject(error)
            else resolve()
        })
        failedQueue = []
    }

    axiosInstance.interceptors.response.use(
        (res) => {
            logger.debug(`API response: ${String(res.config.url)}`, res)
            return res
        },
        async (error: AxiosError) => {
            const originalRequest = error.config
            if (!originalRequest) return Promise.reject(error)

            logger.debug(
                `API error response: ${String(originalRequest.url)}`,
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
                        processQueue(null)
                        return await axiosInstance(originalRequest)
                    }
                    const refreshError = new Error('Failed to refresh token', {
                        cause: error,
                    })
                    processQueue(refreshError)
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
    return axiosInstance
}
