import { logger } from '@/lib/logger'
import { EnvSchema, type RawEnvSource } from '@/models/env'

export const buildEnv = (envSource: RawEnvSource = import.meta.env) => {
    const env = Object.entries(envSource).reduce<Record<string, string>>(
        (acc, [key, value]) => {
            if (key.startsWith('VITE_'))
                acc[key.replace('VITE_', '')] = String(value)
            return acc
        },
        {}
    )
    const parsedEnv = EnvSchema.safeParse(env)
    if (!parsedEnv.success) throw Error('Failed to parse env vars')
    logger.info('Parsed env vars:', parsedEnv.data)
    return parsedEnv.data
}

let cachedEnv: ReturnType<typeof buildEnv> | null = null

export const getEnv = () => {
    cachedEnv ??= buildEnv()
    return cachedEnv
}
