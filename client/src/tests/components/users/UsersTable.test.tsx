import type { UserPublic } from '@/api/generated'
import {
    dataTableMock,
    getColumn,
    getDataTableProps,
    hasAccessorFn,
    hasAccessorKey,
    hasFilterFn,
    renderCell,
    testHeader,
} from '@/tests/components/utils'
import { getMockProps } from '@/tests/utils'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// import last
import { UsersTable } from '@/components/users/UsersTable'

const roleBadgeMock = vi.fn()

vi.mock('@/components/users/RoleBadge', () => ({
    RoleBadge: (props: unknown) => {
        roleBadgeMock(props)
        return <div data-testid="mock-role-badge" />
    },
}))

const adminUser: UserPublic = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_admin: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
}

const regularUser: UserPublic = {
    id: 2,
    username: 'regular',
    email: 'user@example.com',
    first_name: 'Regular',
    last_name: 'User',
    is_admin: false,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-04T00:00:00.000Z',
}

const defaultUsers = [adminUser, regularUser]

const renderUsersTable = (
    overrides: Partial<Parameters<typeof UsersTable>[0]> = {}
) =>
    render(
        <UsersTable
            {...{ users: defaultUsers, isLoading: false, ...overrides }}
        />
    )

beforeEach(() => {
    vi.clearAllMocks()
})

describe('UsersTable - columns', () => {
    it('configures name column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(cols, (c) => c.id === 'name')

        if (!hasAccessorFn(col))
            throw new Error('Name column does not have an accessorFn')
        expect(col.accessorFn(adminUser, 0)).toBe('Admin User')
        expect(col.accessorFn(regularUser, 0)).toBe('Regular User')

        testHeader(col, 'name', 'Name')
    })

    it('configures username column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'username'
        )

        testHeader(col, 'username', 'Username')
    })

    it('configures email column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'email'
        )

        testHeader(col, 'email', 'Email')
    })

    it('configures role column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(cols, (c) => c.id === 'role')

        if (!hasAccessorFn(col))
            throw new Error('Role column does not have an accessorFn')
        expect(col.accessorFn(adminUser, 0)).toBe('admin')
        expect(col.accessorFn(regularUser, 0)).toBe('user')

        testHeader(col, 'role', 'Role')

        renderCell(col, adminUser)
        renderCell(col, regularUser)

        const badges = screen.queryAllByTestId('mock-role-badge')
        expect(badges).toHaveLength(2)
        expect(roleBadgeMock).toHaveBeenCalledWith(
            expect.objectContaining({ isAdmin: true })
        )
        expect(roleBadgeMock).toHaveBeenCalledWith(
            expect.objectContaining({ isAdmin: false })
        )

        const mockRow = {
            getValue: () => 'admin',
        }

        if (!hasFilterFn(col))
            throw new Error('Role column does not have a filterFn')
        expect(col.filterFn(mockRow, 'role', ['admin'])).toBe(true)
        expect(col.filterFn(mockRow, 'role', ['user'])).toBe(false)
    })

    it('configures created at column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'created_at'
        )

        testHeader(col, 'created_at', 'Created At')

        const { getByText } = renderCell(col, adminUser)
        const expected = new Date(adminUser.created_at).toLocaleString()
        expect(getByText(expected)).toBeInTheDocument()
    })

    it('configures updated at column', () => {
        renderUsersTable()

        const cols = getDataTableProps().columns
        const col = getColumn(
            cols,
            (c) => hasAccessorKey(c) && c.accessorKey === 'updated_at'
        )

        testHeader(col, 'updated_at', 'Updated At')

        const { getByText } = renderCell(col, regularUser)
        const expected = new Date(regularUser.updated_at).toLocaleString()
        expect(getByText(expected)).toBeInTheDocument()
    })
})

describe('UsersTable', () => {
    it('passes props to DataTable', () => {
        renderUsersTable()

        expect(dataTableMock).toHaveBeenCalledOnce()
        const props = getMockProps(dataTableMock)
        expect(props).toMatchObject({
            data: defaultUsers,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            columns: expect.any(Array),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            toolbarConfig: expect.any(Object),
            pageSize: 5,
            isLoading: false,
        })

        expect(screen.getByTestId('mock-users-table')).toBeInTheDocument()
    })
})
