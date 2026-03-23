import { AuthService } from '@/api/generated'
import { useSession } from '@/auth/session'
import { FeedbackFormDialog } from '@/components/FeedbackFormDialog'
import { ModeToggle } from '@/components/ModeToggle'
import { Button } from '@/components/ui/overrides/button'
import { notify } from '@/lib/notify'
import { LogOut, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function HeaderActions() {
    const { refresh } = useSession()
    const navigate = useNavigate()

    const handleLogout = async () => {
        const { error } = await AuthService.logout()
        if (error) {
            notify.error('Failed to log out')
            return
        }
        notify.success('Logged out')
        await refresh()
        void navigate('/login', { replace: true })
    }

    return (
        <>
            <div className="hidden items-center gap-2 md:flex">
                <ModeToggle />
                <FeedbackFormDialog trigger={<Button>Feedback</Button>} />
                <Button
                    variant="destructive"
                    onClick={() => void handleLogout()}
                >
                    Logout
                </Button>
            </div>
            <div className="flex items-center justify-end gap-1 py-1 md:hidden">
                <ModeToggle />
                <FeedbackFormDialog
                    trigger={
                        <Button size="icon" aria-label="Feedback">
                            <MessageCircle className="h-4 w-4" />
                        </Button>
                    }
                />
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => void handleLogout()}
                    aria-label="Logout"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </>
    )
}
