import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/overrides/button'
import type { ComponentProps, ReactNode } from 'react'

type ButtonVariant = ComponentProps<typeof Button>['variant']

interface ConfirmDialogProps {
    open: boolean
    isConfirming: boolean
    title: ReactNode
    children: ReactNode
    confirmLabel: ReactNode
    confirmVariant?: ButtonVariant
    onConfirm: () => void
    onCancel: () => void
    onOpenChange: (isOpen: boolean) => void
}

export function ConfirmDialog({
    open,
    isConfirming,
    title,
    children,
    confirmLabel,
    confirmVariant = 'destructive',
    onConfirm,
    onCancel,
    onOpenChange,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="text-sm">{children}</div>
                <DialogFooter>
                    <Button onClick={onCancel} disabled={isConfirming}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant={confirmVariant}
                        disabled={isConfirming}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
