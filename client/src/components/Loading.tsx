import { Button } from '@/components/ui/overrides/button'
import { Spinner } from '@/components/ui/spinner'

export function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Button disabled size="lg">
                <Spinner className="size-8" />
                <span className="text-md">Loading...</span>
            </Button>
        </div>
    )
}
