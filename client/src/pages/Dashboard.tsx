import { useSession } from '@/auth/useSession'

export function Dashboard() {
    const { user } = useSession()

    return (
        <div className="space-y-2 max-md:p-2 md:space-y-4">
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p>Welcome, {user?.first_name}!</p>
        </div>
    )
}
