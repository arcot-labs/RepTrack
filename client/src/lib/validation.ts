import { trimAndLowerText } from '@/lib/text'
import { z } from 'zod'

export const preprocessString = (
    value: unknown,
    normalize: (value: string) => string
) => (typeof value === 'string' ? normalize(value) : value)

export const preprocessTrim = <TSchema extends z.ZodType>(schema: TSchema) =>
    z.preprocess((value) => preprocessString(value, (v) => v.trim()), schema)

export const preprocessTrimAndLower = <TSchema extends z.ZodType>(
    schema: TSchema
) => z.preprocess((value) => preprocessString(value, trimAndLowerText), schema)

export const isEmailValue = (value: string) =>
    z.email().safeParse(value).success
