import { getEnv } from '@/config/env'

/* eslint-disable no-console */
export const logger = {
    debug: (...args: unknown[]) => {
        if (getEnv().ENV !== 'prod') console.debug(...args)
    },
    info: (...args: unknown[]) => {
        console.info(...args)
    },
    warn: (...args: unknown[]) => {
        console.warn(...args)
    },
    error: (...args: unknown[]) => {
        console.error(...args)
    },
}
/* eslint-enable no-console */
