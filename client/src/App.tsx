import '@/App.css'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/config/env'
import { logger } from '@/lib/logger'

export function App({ children }: { children: React.ReactNode }) {
    logger.info('Loaded env vars:', env)

    return (
        <>
            {children}
            <Toaster
                richColors
                position="bottom-center"
                visibleToasts={5}
                toastOptions={{
                    closeButton: true,
                }}
            />
        </>
    )
}
