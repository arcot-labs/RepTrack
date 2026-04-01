/// <reference types="vitest/config" />

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
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/tests/setup.ts',
        include: ['src/tests/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/api/generated/**', 'src/components/ui/**'],
        },
    },
})
