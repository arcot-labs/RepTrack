import {
    type AccessRequestPublic,
    AdminService,
    type UserPublic,
} from '@/api/generated'
import { AccessRequestsTable } from '@/components/AccessRequestsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable } from '@/components/UsersTable'
import { handleApiError } from '@/lib/http'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'

export function Admin() {
    const [requests, setRequests] = useState<AccessRequestPublic[]>([])
    const [users, setUsers] = useState<UserPublic[]>([])
    const [loadingRequests, setLoadingRequests] = useState(true)
    const [loadingUsers, setLoadingUsers] = useState(true)

    const loadAccessRequests = async () => {
        setLoadingRequests(true)
        try {
            const { data, error } = await AdminService.getAccessRequests()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch access requests',
                })
                setRequests([])
                return
            }
            logger.info('Fetched access requests', data)
            setRequests(data)
        } finally {
            setLoadingRequests(false)
        }
    }

    const handleRequestUpdated = (request: AccessRequestPublic) => {
        setRequests((prev) =>
            prev.map((req) => (req.id === request.id ? request : req))
        )
    }

    const loadUsers = async () => {
        setLoadingUsers(true)
        try {
            const { data, error } = await AdminService.getUsers()
            if (error) {
                await handleApiError(error, {
                    fallbackMessage: 'Failed to fetch users',
                })
                setUsers([])
                return
            }
            logger.info('Fetched users', data)
            setUsers(data)
        } finally {
            setLoadingUsers(false)
        }
    }

    useEffect(() => {
        void loadAccessRequests()
        void loadUsers()
    }, [])

    return (
        <div className="space-y-4">
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-xl font-bold">Access Requests</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AccessRequestsTable
                        requests={requests}
                        isLoading={loadingRequests}
                        onRequestUpdated={handleRequestUpdated}
                        onReloadRequests={loadAccessRequests}
                    />
                </CardContent>
            </Card>
            <Card className="gap-2">
                <CardHeader>
                    <CardTitle>
                        <h1 className="text-xl font-bold">Users</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <UsersTable users={users} isLoading={loadingUsers} />
                </CardContent>
            </Card>
        </div>
    )
}
