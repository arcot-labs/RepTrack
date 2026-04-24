import { Admin } from '@/pages/Admin'
import { getMockProps } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest'

interface UseAccessRequestsReturn {
    requests: unknown[]
    isLoading: boolean
    reload: () => Promise<void>
    update: (req: unknown) => void
}

interface UseUsersReturn {
    users: unknown[]
    isLoading: boolean
}

const useAccessRequestsMock: MockedFunction<() => UseAccessRequestsReturn> =
    vi.fn()
const useUsersMock: MockedFunction<() => UseUsersReturn> = vi.fn()

const accessRequestsTableMock = vi.fn()
const usersTableMock = vi.fn()

vi.mock('@/components/access-requests/useAccessRequests', () => ({
    useAccessRequests: () => useAccessRequestsMock(),
}))

vi.mock('@/components/users/useUsers', () => ({
    useUsers: () => useUsersMock(),
}))

vi.mock('@/components/access-requests/AccessRequestsTable', () => ({
    AccessRequestsTable: (props: Record<string, unknown>) => {
        accessRequestsTableMock(props)
        return <div data-testid="access-requests-table" />
    },
}))

vi.mock('@/components/users/UsersTable', () => ({
    UsersTable: (props: Record<string, unknown>) => {
        usersTableMock(props)
        return <div data-testid="users-table" />
    },
}))

describe('Admin', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAccessRequestsMock.mockReturnValue({
            requests: [{ id: 1 }],
            isLoading: false,
            reload: vi.fn().mockResolvedValue(undefined),
            update: vi.fn(),
        })
        useUsersMock.mockReturnValue({
            users: [{ id: 2 }],
            isLoading: false,
        })
    })

    it('renders page layout', () => {
        render(<Admin />)

        expect(screen.getByText('Access Requests')).toBeInTheDocument()
        expect(screen.getByText('Users')).toBeInTheDocument()
        expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(2)
    })

    it('wires access requests hook data into AccessRequestsTable', () => {
        const reloadRequests = vi.fn().mockResolvedValue(undefined)
        const updateRequest = vi.fn()

        useAccessRequestsMock.mockReturnValue({
            requests: [{ id: 123 }],
            isLoading: true,
            reload: reloadRequests,
            update: updateRequest,
        })

        render(<Admin />)

        expect(screen.getByTestId('access-requests-table')).toBeInTheDocument()
        expect(accessRequestsTableMock).toHaveBeenCalledOnce()

        const props = getMockProps(accessRequestsTableMock) as {
            requests: unknown[]
            isLoading: boolean
            onReloadRequests: unknown
            onRequestUpdated: unknown
        }

        expect(props.requests).toEqual([{ id: 123 }])
        expect(props.isLoading).toBe(true)
        expect(props.onReloadRequests).toBe(reloadRequests)
        expect(props.onRequestUpdated).toBe(updateRequest)
    })

    it('wires users hook data into UsersTable', () => {
        useUsersMock.mockReturnValue({
            users: [{ id: 456 }],
            isLoading: true,
        })

        render(<Admin />)

        expect(screen.getByTestId('users-table')).toBeInTheDocument()
        expect(usersTableMock).toHaveBeenCalledOnce()

        const props = getMockProps(usersTableMock) as {
            users: unknown[]
            isLoading: boolean
        }

        expect(props.users).toEqual([{ id: 456 }])
        expect(props.isLoading).toBe(true)
    })
})
