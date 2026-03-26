import {
    type AccessRequestPublic,
    AccessRequestService,
    type UserPublic,
    UserService,
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
    const [isLoadingRequests, setIsLoadingRequests] = useState(true)
    const [isLoadingUsers, setIsLoadingUsers] = useState(true)

    const loadAccessRequests = async () => {
        setIsLoadingRequests(true)
        try {
            const { data, error } =
                await AccessRequestService.getAccessRequests()
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
            setIsLoadingRequests(false)
        }
    }

    const handleRequestUpdated = (request: AccessRequestPublic) => {
        setRequests((prev) =>
            prev.map((req) => (req.id === request.id ? request : req))
        )
    }

    const loadUsers = async () => {
        setIsLoadingUsers(true)
        try {
            const { data, error } = await UserService.getUsers()
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
            setIsLoadingUsers(false)
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
                        isLoading={isLoadingRequests}
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
                    <UsersTable users={users} isLoading={isLoadingUsers} />
                </CardContent>
            </Card>
        </div>
    )
}
