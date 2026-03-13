import { configureApiClient } from '@/api/axios'
import { App } from '@/App'
import { AppRoutes } from '@/AppRoutes'
import { SessionProvider } from '@/auth/SessionProvider'
import { env } from '@/config/env'
import '@/index.css'
import { ThemeProvider } from 'next-themes'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as z from 'zod'
import { en } from 'zod/locales'

if (env.ENV !== 'prod') document.title = `RepTrack (${env.ENV})`

z.config(en())

configureApiClient()

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider attribute="class" disableTransitionOnChange>
        <App>
            <SessionProvider>
                <BrowserRouter>
                    <AppRoutes />
                </BrowserRouter>
            </SessionProvider>
        </App>
    </ThemeProvider>
)
