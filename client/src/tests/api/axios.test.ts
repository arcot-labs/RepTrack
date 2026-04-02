import { configureApiClient } from '@/api/axios'
import { loginUrl, refreshTokenUrl } from '@/tests/mocks/handlers/auth'
import { errorUrl, protectedUrl, successUrl } from '@/tests/mocks/handlers/base'
import { server } from '@/tests/mocks/server'
import { AxiosError } from 'axios'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    debug: vi.fn(),
    info: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

const envMock = vi.hoisted(() => ({ getEnv: () => ({ API_URL: '' }) }))
vi.mock('@/config/env', () => envMock)

const okResponse = HttpResponse.json('ok')
const unauthorizedResponse = new HttpResponse('unauthorized', { status: 401 })
const errorResponse = new HttpResponse('error', { status: 500 })

beforeEach(() => {
    envMock.getEnv = () => ({ API_URL: '' })
    Object.values(loggerMocks).forEach((mock) => mock.mockReset())
})

describe('configureApiClient', () => {
    it('sets up axios instance with base url and credentials', () => {
        envMock.getEnv = () => ({ API_URL: 'https://api.localhost' })
        const axiosInstance = configureApiClient()

        expect(axiosInstance.defaults.baseURL).toBe('https://api.localhost')
        expect(axiosInstance.defaults.withCredentials).toBe(true)
        expect(axiosInstance.interceptors.response.handlers).toHaveLength(1)
    })

    it('forwards success response', async () => {
        const axiosInstance = configureApiClient()

        const res = await axiosInstance.get(successUrl)

        expect(res.status).toBe(200)
        expect(res.data).toEqual('ok')

        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects error response no request config', async () => {
        const axiosInstance = configureApiClient()
        const noConfigError = new AxiosError('no config')

        axiosInstance.interceptors.request.use(() => {
            throw noConfigError
        })

        await expect(axiosInstance.get(successUrl)).rejects.toBe(noConfigError)
        expect(loggerMocks.debug).not.toHaveBeenCalled()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects non-401 error response', async () => {
        const axiosInstance = configureApiClient()

        await expect(axiosInstance.get(errorUrl)).rejects.toMatchObject({
            response: {
                status: 500,
            },
        })

        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects error response for already retried request', async () => {
        const axiosInstance = configureApiClient()

        axiosInstance.interceptors.request.use((config) => {
            config._retry = true
            return config
        })

        server.use(http.get(protectedUrl, () => unauthorizedResponse.clone()))

        await expect(axiosInstance.get(protectedUrl)).rejects.toMatchObject({
            response: { status: 401 },
        })

        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects error response when request url is undefined', async () => {
        const axiosInstance = configureApiClient()
        const noUrlError = new AxiosError('no url', 'NO_URL', {} as never)

        axiosInstance.interceptors.request.use(() => {
            throw noUrlError
        })

        await expect(axiosInstance.get(successUrl)).rejects.toBe(noUrlError)
        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects error response for refresh url request', async () => {
        const axiosInstance = configureApiClient()

        server.use(http.post(refreshTokenUrl, () => errorResponse.clone()))

        await expect(axiosInstance.post(refreshTokenUrl)).rejects.toBeDefined()

        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('rejects error response for login url request', async () => {
        const axiosInstance = configureApiClient()

        server.use(http.post(loginUrl, () => errorResponse.clone()))

        await expect(axiosInstance.post(loginUrl)).rejects.toBeDefined()

        expect(loggerMocks.debug).toHaveBeenCalledOnce()
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('refreshes token and retries original request on 401 response', async () => {
        const axiosInstance = configureApiClient()

        let protectedCallCount = 0
        let refreshCallCount = 0

        server.use(
            http.get(protectedUrl, () => {
                protectedCallCount += 1
                if (protectedCallCount === 1)
                    return unauthorizedResponse.clone()
                return okResponse.clone()
            }),
            http.post(refreshTokenUrl, () => {
                refreshCallCount += 1
                return new HttpResponse(null, { status: 204 })
            })
        )

        const res = await axiosInstance.get(protectedUrl)

        expect(res.status).toBe(200)
        expect(res.data).toEqual('ok')

        expect(protectedCallCount).toBe(2)
        expect(refreshCallCount).toBe(1)

        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Success refreshing token'
        )
    })

    it('rejects request if token refresh fails', async () => {
        const axiosInstance = configureApiClient()

        let protectedCallCount = 0
        let refreshCallCount = 0

        server.use(
            http.get(protectedUrl, () => {
                protectedCallCount += 1
                return unauthorizedResponse.clone()
            }),
            http.post(refreshTokenUrl, () => {
                refreshCallCount += 1
                return errorResponse.clone()
            })
        )

        await expect(axiosInstance.get(protectedUrl)).rejects.toThrow(
            'Failed to refresh token'
        )

        expect(protectedCallCount).toBe(1)
        expect(refreshCallCount).toBe(1)

        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('queues concurrent 401 requests and refreshes only once', async () => {
        const axiosInstance = configureApiClient()

        let isRefreshed = false
        let protectedCallCount = 0
        let refreshCallCount = 0

        server.use(
            http.get(protectedUrl, () => {
                protectedCallCount += 1
                if (!isRefreshed) return unauthorizedResponse.clone()
                return okResponse.clone()
            }),
            http.post(refreshTokenUrl, async () => {
                refreshCallCount += 1
                await delay(50)
                isRefreshed = true
                return new HttpResponse(null, { status: 204 })
            })
        )

        const [firstRes, secondRes] = await Promise.all([
            axiosInstance.get(protectedUrl),
            axiosInstance.get(protectedUrl),
        ])

        expect(firstRes.status).toBe(200)
        expect(firstRes.data).toEqual('ok')
        expect(secondRes.status).toBe(200)
        expect(secondRes.data).toEqual('ok')

        expect(protectedCallCount).toBe(4)
        expect(refreshCallCount).toBe(1)

        expect(loggerMocks.info).toHaveBeenCalledExactlyOnceWith(
            'Success refreshing token'
        )
    })

    it('rejects queued requests when refresh fails', async () => {
        const axiosInstance = configureApiClient()

        let refreshCallCount = 0
        let protectedCallCount = 0

        server.use(
            http.get(protectedUrl, () => {
                protectedCallCount += 1
                return unauthorizedResponse.clone()
            }),
            http.post(refreshTokenUrl, async () => {
                refreshCallCount += 1
                await delay(50)
                return errorResponse.clone()
            })
        )

        const results = await Promise.allSettled([
            axiosInstance.get(protectedUrl),
            axiosInstance.get(protectedUrl),
        ])

        expect(results[0].status).toBe('rejected')
        expect(results[1].status).toBe('rejected')

        expect(refreshCallCount).toBe(1)
        expect(protectedCallCount).toBe(2)

        expect(loggerMocks.info).not.toHaveBeenCalled()
    })
})
