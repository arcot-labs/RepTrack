import { getMockCallArg } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const enLocale = { locale: 'en' }

interface MainBootstrapMocks {
    getEnvMock: ReturnType<typeof vi.fn>
    zConfigMock: ReturnType<typeof vi.fn>
    configureApiClientMock: ReturnType<typeof vi.fn>
    rootRenderMock: ReturnType<typeof vi.fn>
    createRootMock: ReturnType<typeof vi.fn>
    themeProviderMock: ReturnType<typeof vi.fn>
}

async function loadMainWithEnv(
    env: string,
    originalTitle: string
): Promise<MainBootstrapMocks> {
    vi.resetModules()

    document.title = originalTitle
    document.body.innerHTML = '<div id="root"></div>'

    const getEnvMock = vi.fn(() => ({ ENV: env }))
    const zConfigMock = vi.fn()
    const configureApiClientMock = vi.fn()
    const rootRenderMock = vi.fn()
    const createRootMock = vi.fn(() => ({ render: rootRenderMock }))
    const themeProviderMock = vi.fn()

    vi.doMock('@/api/axios', () => ({
        configureApiClient: configureApiClientMock,
    }))
    vi.doMock('@/config/env', () => ({
        getEnv: getEnvMock,
    }))
    vi.doMock('@/App', () => ({
        App: ({ children }: { children: ReactNode }) => (
            <div data-testid="app-shell">{children}</div>
        ),
    }))
    vi.doMock('@/AppRoutes', () => ({
        AppRoutes: () => <div data-testid="app-routes">routes</div>,
    }))
    vi.doMock('@/auth/SessionProvider', () => ({
        SessionProvider: ({ children }: { children: ReactNode }) => (
            <div data-testid="session-provider">{children}</div>
        ),
    }))
    vi.doMock('@/components/ui/overrides/tooltip', () => ({
        TooltipProvider: ({ children }: { children: ReactNode }) => (
            <div data-testid="tooltip-provider">{children}</div>
        ),
    }))
    vi.doMock('next-themes', () => ({
        ThemeProvider: ({
            children,
            ...props
        }: {
            children: ReactNode
            attribute?: string
            disableTransitionOnChange?: boolean
        }) => {
            themeProviderMock(props)
            return <div data-testid="theme-provider">{children}</div>
        },
    }))
    vi.doMock('react-router-dom', async () => {
        const actual =
            await vi.importActual<typeof import('react-router-dom')>(
                'react-router-dom'
            )
        return {
            ...actual,
            BrowserRouter: ({ children }: { children: ReactNode }) => (
                <div data-testid="browser-router">{children}</div>
            ),
        }
    })
    vi.doMock('react-dom/client', () => ({
        default: {
            createRoot: createRootMock,
        },
        createRoot: createRootMock,
    }))
    vi.doMock('zod', () => ({
        config: zConfigMock,
    }))
    vi.doMock('zod/locales', () => ({
        en: () => enLocale,
    }))

    await import('@/main')

    return {
        getEnvMock,
        zConfigMock,
        configureApiClientMock,
        rootRenderMock,
        createRootMock,
        themeProviderMock,
    }
}

describe('main bootstrap', () => {
    it('sets non-prod title and initializes app root tree', async () => {
        const {
            getEnvMock,
            zConfigMock,
            configureApiClientMock,
            rootRenderMock,
            createRootMock,
            themeProviderMock,
        } = await loadMainWithEnv('dev', 'Original Title')

        expect(getEnvMock).toHaveBeenCalledTimes(2)
        expect(document.title).toBe('RepTrack (dev)')
        expect(zConfigMock).toHaveBeenCalledExactlyOnceWith(enLocale)
        expect(configureApiClientMock).toHaveBeenCalledTimes(1)

        expect(rootRenderMock).toHaveBeenCalledTimes(1)
        const rootElement = document.getElementById('root')
        expect(createRootMock).toHaveBeenCalledWith(rootElement)

        const renderedTree = getMockCallArg(rootRenderMock)
        render(renderedTree as never)

        expect(themeProviderMock).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({
                attribute: 'class',
                disableTransitionOnChange: true,
            })
        )

        expect(screen.getByTestId('theme-provider')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument()
        expect(screen.getByTestId('app-shell')).toBeInTheDocument()
        expect(screen.getByTestId('session-provider')).toBeInTheDocument()
        expect(screen.getByTestId('browser-router')).toBeInTheDocument()
        expect(screen.getByTestId('app-routes')).toBeInTheDocument()
    })

    it('does not change title in prod and still bootstraps dependencies', async () => {
        const {
            getEnvMock,
            zConfigMock,
            configureApiClientMock,
            rootRenderMock,
            createRootMock,
        } = await loadMainWithEnv('prod', 'Original Title')

        expect(getEnvMock).toHaveBeenCalledTimes(1)
        expect(document.title).toBe('Original Title')
        expect(zConfigMock).toHaveBeenCalledExactlyOnceWith(enLocale)
        expect(configureApiClientMock).toHaveBeenCalledTimes(1)

        expect(rootRenderMock).toHaveBeenCalledTimes(1)
        expect(createRootMock).toHaveBeenCalledTimes(1)
    })
})
