import { configureApiClient } from '@/api/axios'
import { App } from '@/App'
import { AppRoutes } from '@/AppRoutes'
import { SessionProvider } from '@/auth/SessionProvider'
import { TooltipProvider } from '@/components/ui/overrides/tooltip'
import { getEnv } from '@/config/env'
import '@/index.css'
import { ThemeProvider } from 'next-themes'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as z from 'zod'
import { en } from 'zod/locales'

if (getEnv().ENV !== 'prod') document.title = `RepTrack (${getEnv().ENV})`

z.config(en())

configureApiClient()

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider attribute="class" disableTransitionOnChange>
        <TooltipProvider>
            <App>
                <SessionProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </SessionProvider>
            </App>
        </TooltipProvider>
    </ThemeProvider>
)
