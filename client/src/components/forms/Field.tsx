import { Label } from '@/components/ui/label'
import type { ReactNode } from 'react'

export interface FieldProps {
    label: string
    htmlFor?: string
    error?: string
    children: ReactNode
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
    return (
        <div className="space-y-1">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
