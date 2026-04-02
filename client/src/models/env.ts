import * as z from 'zod'

type RawEnvValue = string | boolean | undefined
export type RawEnvSource = Record<string, RawEnvValue>

export const EnvSchema = z.object({
    ENV: z.enum(['dev', 'test', 'stage', 'prod']),
    IMAGE_TAG: z.string(),
    API_URL: z.string(),
})
