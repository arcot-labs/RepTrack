import '@/App.css'
import { Toaster } from '@/components/ui/sonner'

export function App({ children }: { children: React.ReactNode }) {
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
