import { AccessRequestsTable } from '@/components/access-requests/AccessRequestsTable'
import { useAccessRequests } from '@/components/access-requests/useAccessRequests'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/overrides/card'
import { UsersTable } from '@/components/users/UsersTable'
import { useUsers } from '@/components/users/useUsers'

export function Admin() {
    const {
        requests,
        isLoading: isLoadingRequests,
        reload: reloadRequests,
        update: updateRequest,
    } = useAccessRequests()

    const { users, isLoading: isLoadingUsers } = useUsers()

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Access Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <AccessRequestsTable
                        requests={requests}
                        isLoading={isLoadingRequests}
                        onRequestUpdated={updateRequest}
                        onReloadRequests={reloadRequests}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <UsersTable users={users} isLoading={isLoadingUsers} />
                </CardContent>
            </Card>
        </div>
    )
}
