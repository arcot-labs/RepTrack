import { useSession } from '@/auth/session'
import { SessionProvider } from '@/auth/SessionProvider'
import { getCurrentUserUrl, testUser } from '@/tests/mocks/handlers/user'
import { server } from '@/tests/mocks/server'
import { render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { act, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loggerMocks = vi.hoisted(() => ({
    info: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
    logger: loggerMocks,
}))

const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
)

function Consumer() {
    const { user, isLoading, isAuthenticated, refresh } = useSession()

    if (isLoading) return <div>Loading</div>
    return (
        <div>
            <span>{user?.username ?? 'none'}</span>
            <span>
                {isAuthenticated ? 'authenticated' : 'not-authenticated'}
            </span>
            <button onClick={() => void refresh()}>refresh</button>
        </div>
    )
}

const unauthorizedResponse = new HttpResponse('Unauthorized', { status: 401 })
const freshUserResponse = HttpResponse.json({
    ...testUser,
    username: 'fresh-user',
})

beforeEach(() => {
    vi.clearAllMocks()
})

describe('SessionProvider (hook)', () => {
    it('loads current user and exposes session state', async () => {
        const { result } = renderHook(() => useSession(), { wrapper })

        expect(result.current.isLoading).toBe(true)

        await waitFor(() => {
            expect(result.current.user).not.toBeNull()
        })

        expect(result.current.user?.username).toBe(testUser.username)
        expect(result.current.isAuthenticated).toBe(true)
        expect(loggerMocks.info).toHaveBeenCalledWith(
            'Fetched current user',
            expect.objectContaining({ username: testUser.username })
        )
    })

    it('clears session when fetch fails', async () => {
        server.use(
            http.get(getCurrentUserUrl, () => unauthorizedResponse.clone())
        )

        const { result } = renderHook(() => useSession(), { wrapper })

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false)
        })

        expect(result.current.user).toBeNull()
        expect(result.current.isAuthenticated).toBe(false)
        expect(loggerMocks.info).not.toHaveBeenCalled()
    })

    it('refreshes session when refresh is invoked', async () => {
        const { result } = renderHook(() => useSession(), { wrapper })

        await waitFor(() => {
            expect(result.current.user).not.toBeNull()
        })

        server.use(http.get(getCurrentUserUrl, () => freshUserResponse.clone()))

        await act(async () => {
            await result.current.refresh()
        })

        expect(result.current.user?.username).toBe('fresh-user')
        expect(loggerMocks.info).toHaveBeenCalledTimes(2)
    })
})

describe('SessionProvider (UI)', () => {
    it('renders authenticated user', async () => {
        render(<Consumer />, { wrapper })

        expect(await screen.findByText(testUser.username)).toBeInTheDocument()
        expect(screen.getByText('authenticated')).toBeInTheDocument()
    })

    it('handles unauthenticated state', async () => {
        server.use(
            http.get(getCurrentUserUrl, () => unauthorizedResponse.clone())
        )

        render(<Consumer />, { wrapper })

        expect(await screen.findByText('none')).toBeInTheDocument()
        expect(screen.getByText('not-authenticated')).toBeInTheDocument()
    })

    it('re-renders when session is refreshed', async () => {
        render(<Consumer />, { wrapper })

        expect(await screen.findByText(testUser.username)).toBeInTheDocument()

        server.use(http.get(getCurrentUserUrl, () => freshUserResponse.clone()))

        const user = userEvent.setup()
        await user.click(screen.getByRole('button', { name: /refresh/i }))

        expect(await screen.findByText('fresh-user')).toBeInTheDocument()
    })
})
