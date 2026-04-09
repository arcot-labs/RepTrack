import { dash } from '@/lib/text'

export function formatDateTime(value: string) {
    return new Date(value).toLocaleString()
}

export function formatNullableDateTime(value?: string | null) {
    if (!value) return dash
    return formatDateTime(value)
}
