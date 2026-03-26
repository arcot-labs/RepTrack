import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    envDir: '../config/env',
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        forwardConsole: {
            unhandledErrors: true,
            logLevels: ['debug', 'log', 'info', 'warn', 'error'],
        },
    },
})
